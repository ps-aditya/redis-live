# First User Observations — Session 1

Date: (today's date)
Tester: Aditya (author)

## What I noticed trying to use RSE as a real user

### Things that confused me

1. **TTL timer was easy to miss** — the number changing didn't feel significant because it was small text. I had to look carefully to spot it.

2. **Three equal columns felt arbitrary** — the console doesn't need to be as wide as the state panel. Commands are short. Values are what matters.

3. **"It does stuff but not meaningfully"** — panels update but nothing announces the change. My eye didn't know where to look after running a command.

4. **The diff panel was below the fold** — I had to scroll to see what changed, but that's the most important output after a command.

5. **Experiments launched all at once** — hitting Launch ran all commands instantly. I couldn't feel the cause-and-effect. One step at a time is how learning actually works.

### Questions a first-year CS student would ask

1. What is a key? What is a value? (Nothing explains this)
2. Why is my list showing [0] task3 instead of [0] task1? (LPUSH prepends — this needs explanation)
3. What does TTL mean? (The label exists but no explanation)
4. Why did Redis refuse my command? (WRONGTYPE error needs more context)
5. What's the difference between DEL and just setting empty string?
6. How do I know if my command worked if GET returns nil?

### Fixes applied today

- TTL number is now 16px font, bar is 5px thick, pulses red below 10s
- Layout changed from equal thirds to 25% / 45% / 30%
- Experiments now run one step at a time with a "Run this step →" button
- Diff panel gets a brief flash animation when it updates
- Card values are larger (18px for string values)

### What still needs work (next session)

- First-time empty state should explain what Redis is in 2 sentences
- LPUSH behavior (prepend vs append) should be explained in the experiment
- TTL label should have a tooltip: "Time To Live — seconds until this key auto-deletes"
- Error messages need plain-English translation, not just the Redis error string