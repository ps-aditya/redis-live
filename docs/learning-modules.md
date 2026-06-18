# Experiments

## Experiment 1

Strings and Key-Value Storage

Questions:

* What happens when a key is created?
* What happens when it is overwritten?
* What happens when it is deleted?

Commands:

* SET
* GET
* DEL
* EXISTS

---

## Experiment 2

Expiration and TTL

Questions:

* What happens when a key expires?
* How does Redis track expiration?

Commands:

* EXPIRE
* TTL

---

## Experiment 3

Lists

Questions:

* Can Redis behave like a queue?
* Can Redis behave like a stack?

Commands:

* LPUSH
* RPUSH
* LPOP
* RPOP

---

## Experiment 4

Sets

Questions:

* Why are duplicates ignored?
* How does membership checking work?

Commands:

* SADD
* SMEMBERS
* SISMEMBER

---

## Experiment 5

Hashes

Questions:

* How can Redis represent structured objects?

Commands:

* HSET
* HGET
* HGETALL

---

Future Experiments

* Pub/Sub
* Streams
* Persistence
* Replication
* Clustering
* Memory Management
* Eviction Policies
