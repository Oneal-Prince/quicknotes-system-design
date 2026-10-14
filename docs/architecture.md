# QuickNotes System Architecture

## 1. Requirements

### Functional requirements
- Users can load, create, view, update, and delete their notes.
- Users can search notes and organize notes with tags.
- Users can only access notes they own.
- The API validates note titles and returns useful error responses.
- The UI shows loading, success, error, and empty states.

### Non-functional requirements
- Availability target: 99.9% monthly for the production API.
- Read requests should normally respond within 300 ms at the 95th percentile, excluding slow client networks.
- The system should scale horizontally as traffic grows.
- User data must be protected by authentication, authorization, HTTPS, and secure password hashing.
- Database backups and tested restoration procedures must protect against data loss.
- Logs and metrics should make errors and latency observable.

## 2. Load estimates for one million registered users

### Assumptions
- 1,000,000 registered users.
- 10% daily active users: 100,000 DAU.
- Each active user reads 20 note/feed views per day.
- Each active user creates 2 notes per day.
- 86,400 seconds per day; average rates assume traffic is evenly distributed.
- Peak traffic is 5 times the average.
- Average stored note content and metadata is 2 KB per note.
- Every active user creates 2 notes daily; note history, replicas, indexes, backups, and logs are excluded from base storage.

### Reads per second
Daily reads = 100,000 × 20 = 2,000,000.

Average reads/sec = 2,000,000 ÷ 86,400 ≈ **23.15 reads/sec**.

Estimated peak reads/sec = 23.15 × 5 ≈ **115.74 reads/sec**.

### Writes per second
Daily writes = 100,000 × 2 = 200,000.

Average writes/sec = 200,000 ÷ 86,400 ≈ **2.31 writes/sec**.

Estimated peak writes/sec = 2.31 × 5 ≈ **11.57 writes/sec**.

### Storage per year
Annual notes = 200,000 × 365 = 73,000,000 notes.

Annual content and metadata storage = 73,000,000 × 2 KB = 146,000,000 KB ≈ **146 GB/year** using decimal units.

This is a baseline estimate; real storage will be higher when indexes, backups, revisions, attachments, and replication are included.

## 3. Architecture diagram

```text
                         +------------------+
                         |   Web / Mobile   |
                         |      Client      |
                         +--------+---------+
                                  |
                                  v
                         +------------------+
                         |       DNS        |
                         +--------+---------+
                                  |
                                  v
                         +------------------+
                         |       CDN        |
                         | Static assets    |
                         +--------+---------+
                                  |
                                  v
                         +------------------+
                         |  Load Balancer   |
                         +--------+---------+
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
            +---------------+           +---------------+
            | App Server A  |           | App Server B  |
            | REST API      |           | REST API      |
            +-------+-------+           +-------+-------+
                    |                           |
                    +-------------+-------------+
                                  |
                   +--------------+---------------+
                   |              |               |
                   v              v               v
             +-----------+  +------------+  +-------------+
             |   Cache   |  | Primary DB |->| Read Replica|
             | hot reads |  | writes     |  | read queries|
             +-----------+  +------+-----+  +-------------+
                                   |
                                   v
                            +-------------+
                            | Message     |
                            | Queue       |
                            +------+------+
                                   |
                                   v
                            +-------------+
                            | Background  |
                            | Worker      |
                            +-------------+
```

## 4. Components and the problems they solve

- **Client:** Provides the user interface for managing notes and sends API requests.
- **DNS:** Maps the application domain to the service endpoint so clients can locate the application.
- **CDN:** Caches static assets near users to reduce latency and origin traffic.
- **Load balancer:** Distributes incoming requests across healthy app servers and routes around failed instances.
- **App servers (A and B):** Run API logic and scale horizontally so one instance is not responsible for all requests.
- **Cache:** Keeps frequently requested note data in fast memory to reduce repeated database reads; invalidation rules prevent stale data from lingering too long.
- **Primary database:** Stores authoritative users, notes, tags, and relationships and handles writes transactionally.
- **Read replica:** Serves read queries to reduce primary database load, with the trade-off that replication may lag.
- **Message queue:** Buffers asynchronous jobs and decouples API requests from background processing.
- **Background worker:** Processes queued work such as notifications, indexing, and cleanup without making the user wait for it.

## 5. GET /notes request flow

1. The client resolves the application hostname through DNS.
2. The client requests `/api/v1/notes`; the CDN serves cached static assets, while the dynamic API request is forwarded to the load balancer.
3. The load balancer routes the request to a healthy app server.
4. The app server authenticates the user and checks authorization.
5. The server checks the cache for the user's notes.
6. If the cache contains fresh data, the server returns it; otherwise, it queries the read replica.
7. The server places eligible results in the cache and returns a JSON response with pagination metadata.
8. The client renders the notes and displays the appropriate status.

## 6. POST /notes request flow

1. The client submits a note title and body to `/api/v1/notes`.
2. DNS resolves the domain and the load balancer forwards the API request to a healthy app server.
3. The app server authenticates the user, validates the title, and derives the owner ID from the authenticated identity.
4. The server writes the new note to the primary database in a transaction.
5. The server invalidates or updates relevant cache entries so the new note can be seen.
6. If side effects are required, the server publishes a job to the queue after the database transaction succeeds, ideally using a transactional outbox to avoid losing events.
7. A background worker processes the job and retries transient failures.
8. The API returns `201 Created` with the saved note, and the client updates the UI.

## 7. Trade-offs and single points of failure

### Trade-off 1: Cache speed versus freshness
Caching makes reads faster and lowers database load, but cached notes can become stale after a write. Use short TTLs, cache invalidation after successful updates, and avoid caching private data under keys shared between users.

### Trade-off 2: Read replicas versus consistency
Read replicas increase read capacity, but asynchronous replication can delay visibility of recent writes. Read-after-write requests can temporarily use the primary database when immediate consistency is required.

### Trade-off 3: Queue-based work versus operational complexity
Queues let the API respond without waiting for background jobs, but introduce retry, duplicate-delivery, and monitoring concerns. Make workers idempotent, retry transient errors, and route repeatedly failing jobs to a dead-letter queue.

### Trade-off 4: More app servers versus cost
Multiple app servers improve availability and allow horizontal scaling, but increase infrastructure cost and operational complexity. Use health checks and autoscaling based on latency, CPU, and request rate.

### Avoiding single points of failure
Run at least two app servers across separate failure domains behind a health-checking load balancer. Use a managed, redundant DNS and CDN service; deploy the database with automated failover and tested backups; configure the cache and queue with replication or managed high-availability options; and monitor every critical component. A read replica alone is not a complete failover plan: database promotion, connection routing, recovery objectives, and restore testing must also be configured.
