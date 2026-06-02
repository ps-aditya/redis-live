# Vision

## Problem

I came across a reddit post which had this huge discussion on whether or not Redis shows up in complex designs. This got me thinking about the internals and optimizations, both of which are hidden. 

Most Redis learning resources focus on commands, syntax, and tutorials.

Learners often understand what commands do, but struggle to understand what is happening internally inside Redis.

Redis behaves like a black box.

Users execute commands and receive outputs without developing intuition about state changes, memory behavior, expiration, data structures, and real-world system design patterns.

## Goal

Redis State Explorer exists to make Redis observable.

Instead of teaching Redis through lessons alone, RSE allows users to experiment, break things, observe state transitions, and develop understanding through exploration.

## Core Idea

Every Redis action should produce a visible consequence.

Users should be able to see:

* What changed
* Why it changed
* How Redis stores it
* What happens next

## Principles

* Understand through exploration
* Visualize everything
* Encourage experimentation
* Make state observable
* Prioritize intuition over memorization

## Long-Term Vision

Become the most intuitive environment for exploring Redis and understanding how modern infrastructure systems behave under real-world conditions.

