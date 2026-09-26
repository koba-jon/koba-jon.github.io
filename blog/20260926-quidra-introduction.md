# Introducing Quidra, a New Programming Language

Hello!
This time, I'd like to introduce a new programming language I developed called "Quidra"!

https://github.com/quidra-lang/quidra

What's your favorite programming language?
For me, it's probably C++! I like that feeling that you're building something kind of dangerous, haha.

This time, I tried building a programming language like that from scratch!
It's called **Quidra (pronounced "Kwidra")**, and **the name comes from the Latin word "Quidditas" (essence)**.
As the name suggests, I'm building this programming language with the goal of stripping away everything unnecessary and leaving only the "essence"—in other words, **eliminating ambiguity while making the syntax as short as possible**.
In terms of positioning, I'd classify it as a **statically typed compiled language** (it generates native code with LLVM).
That said, you can run it immediately with a single command like `quidra main.qui`, just like Python, and it also has an interactive REPL (implemented with JIT compilation).

## Goals

- **To be the programming language with the highest semantic compression performance**
  - This is the core idea. Maximizing this is the language's primary goal.
  - More concretely, the idea is to "eliminate ambiguity while making the syntax as short as possible."
  - However, the goal is not to minimize character count like code golf. The key idea is: **remove meaningless tokens, but do not remove meaningful distinctions** (Fewer meaningless tokens, not fewer meaningful distinctions).
  - The slogan is "Maximum Meaning Per Token."
  - For example, in C++, when you see `func(x)`, you cannot tell whether `x` is passed by reference or by value. To find out, you have to go look at the function definition. Likewise, in Python, `y = x + 1` does not determine the types of `x` or `y`. To know the types, you need to trace earlier lines or print them. In that sense, these constructs have high ambiguity.
  - In C++, you do not necessarily need an `int main` if the language instead executes top-level statements from top to bottom like Python. Likewise, braces such as `{}` are unnecessary if indentation distinguishes blocks like Python. In that sense, C++ syntax contains a lot of redundancy.
  - Quidra's philosophy is to eliminate as much of this "ambiguity" and "redundancy" from existing programming languages as possible.
- **To have influence on the scale of Python or C++**
  - I do not want it to end as just a hobby language. Ultimately, I want it to become as well known as other major programming languages.
  - I want to build it together with everyone, not by myself! **I'm looking for collaborators who agree with the language's design philosophy and ideas!**
- **Readable for both humans and LLMs**
  - First, it uses natural-language words that humans already use. It is not simply "the same as existing programming languages": there is no `\n` or `&&`, for example (`and` is used instead of `&&`, and `print` automatically adds a newline).
  - As a side effect of semantic compression, I also want to reduce LLM input/output token consumption: the code is short, while a single line should still be enough to understand what it does. Common English words are often represented as a single token, so I think "natural-language-like while still easy for LLMs to handle" is compatible.
- **Easy for newcomers to learn**
  - For example, Python can express addition simply as `y = x + 1`, so it is easy for beginners. But once you want to do more complex things, you eventually need to learn 1) types (and the value ranges of each type), 2) address/reference semantics (what is passed by value and what can be modified), and 3) bitwise operations. When you try to learn Python deeply, its exceptional syntax and black-box behavior can become difficult to understand, so I think it can actually become harder for intermediate and long-term learners.
  - On the other hand, C++ (or really C) is a language where you need to understand types, address/reference concepts, and bitwise operations from the start. In that sense, it may be easier to understand for intermediate and long-term learners. However, unless you learn relatively difficult topics such as pointer manipulation, you cannot even assign values to an array inside a function. In that sense, it is difficult for beginners.
  - So with Quidra, I want a language that works well from the beginner stage through the intermediate and long-term stages. Concretely, it should have relatively little ceremony and be easy to write like Python, while still keeping types (so it is easier to understand what is happening internally), replacing complex pointer operations with mechanisms such as C++-style reference passing (while still letting users learn the concept of addresses), and of course supporting bitwise operations.
  - Assignments of arrays and classes such as `a = b` are value copies by default (the entire value is copied). If you only want to reference an array or class, you write it explicitly, such as `int[] &a = &b`. Even with value semantics, the compiler is designed so that it can internally omit copying when copying or not copying would produce the same result. For example, when an array is passed to a function that does not modify the argument, Quidra already references it internally without copying. In other words, the user experience is value passing, while the implementation is optimized internally. I designed details like this by thinking back to when I had just started learning programming and choosing the behavior that felt more intuitive.
  - Ultimately, I'd love to see it used as the first programming language in university courses!

## Overview of Quidra

Quidra's number-one goal is "Maximum Meaning Per Token."
Let's look at some actual examples!

**Note:** The code in this article has been tested with Quidra 0.3.0 (language specification 0.2).
Version 0.3.0 is currently on the `develop` branch. Some code does not work on the latest released version or the Playground (0.2 series), so if you want to try it, please build from the `develop` branch.

### Program Example

If we write an actual program for managing student grades, it looks like this.
I packed in a number of Quidra-specific ideas: classes, functions that may fail, pass-by-reference, and more!

```quidra:grades.qui
class Student
    string name
    int[] scores

    construct(string student_name, int[] student_scores)
        name = student_name
        scores = student_scores

    float average()
        int total = 0
        for score in scores
            total += score
        return float(total) / float(len(scores)) // int -> float is an explicit conversion

// A function that may fail includes error in its return type
int | error parse_score(string text)
    int score = try int.parse(text) // If it fails, propagate error to the caller
    if score < 0 or score > 100
        return error("out of range: {text}")
    return score

// int[] & = receive permission to modify the caller's array
void add_bonus(int[] &scores, int bonus)
    for &score in scores
        score = math.min(score + bonus, 100)

Student alice = Student("Alice", [72, 85, 98])
Student backup = alice // Value copy (changing alice does not change backup)
add_bonus(&alice.scores, 5) // & shows at the call site that the original, not a copy, is passed

print("{alice.name}: {alice.average():frac=1}")
print("backup: {backup.average():frac=1}")

for text in ["88", "abc", "120"]
    match parse_score(text) // Both int and error must be handled
        int score
            print("OK {score}")
        error problem
            print("NG {problem}")
```

```text:Output
Alice: 89.0
backup: 85.0
OK 88
NG numeric parse failed
NG out of range: 120
```

A few key points:

- With `int | error`, **a function that may fail says so directly in its return type**. Exceptions do not secretly fly out from behind the scenes.
- The `&` in `add_bonus(&alice.scores, 5)` indicates that **the original value, not a copy, is being passed**. Conversely, if an argument has no `&`, you can determine from the call site alone that **the callee can never modify it**.
- `Student backup = alice` is a value copy, so changing `alice` does not change `backup`.
- With `match`, the code will not compile unless both `int` and `error` are handled.

I also wrote the same logic in Python and C++ and compared token counts (excluding comments, measured with a simple lexer. String literals, including embedded expressions, are counted as one token).

| Language | Lines (excluding blank lines/comments) | Tokens |
|---|---:|---:|
| **Quidra** | 30 | **177** |
| Python (without type hints) | 26 | 178 |
| Python (with type hints) | 26 | 200 |
| C++ | 38 | 296 |

Quidra explicitly writes **all of the static types, write permissions (`&`), and possibility of failure (`int | error`)**, yet uses almost the same number of tokens as Python without type hints!
Compared with C++, it uses roughly 30-40% fewer tokens (depending on whether the contents inside string interpolation expressions `{...}` are counted).

<details><summary>Python and C++ versions (click to expand)</summary>

```python:grades.py
import copy


class Student:
    def __init__(self, name: str, scores: list[int]):
        self.name = name
        self.scores = scores

    def average(self) -> float:
        return sum(self.scores) / len(self.scores)


def parse_score(text: str) -> int:
    score = int(text)
    if score < 0 or score > 100:
        raise ValueError(f"out of range: {text}")
    return score


def add_bonus(scores: list[int], bonus: int) -> None:
    for i in range(len(scores)):
        scores[i] = min(scores[i] + bonus, 100)


alice = Student("Alice", [72, 85, 98])
backup = copy.deepcopy(alice)
add_bonus(alice.scores, 5)

print(f"{alice.name}: {alice.average():.1f}")
print(f"backup: {backup.average():.1f}")

for text in ["88", "abc", "120"]:
    try:
        score = parse_score(text)
        print(f"OK {score}")
    except ValueError as problem:
        print(f"NG {problem}")
```

```cpp:grades.cpp
#include <algorithm>
#include <cstdio>
#include <stdexcept>
#include <string>
#include <vector>

struct Student {
    std::string name;
    std::vector<int> scores;

    double average() const {
        int total = 0;
        for (int score : scores) total += score;
        return static_cast<double>(total) / scores.size();
    }
};

int parse_score(const std::string& text) {
    int score = std::stoi(text);
    if (score < 0 || score > 100) throw std::out_of_range("out of range: " + text);
    return score;
}

void add_bonus(std::vector<int>& scores, int bonus) {
    for (int& score : scores) score = std::min(score + bonus, 100);
}

int main() {
    Student alice{"Alice", {72, 85, 98}};
    Student backup = alice;
    add_bonus(alice.scores, 5);

    std::printf("%s: %.1f\n", alice.name.c_str(), alice.average());
    std::printf("backup: %.1f\n", backup.average());

    for (std::string text : {"88", "abc", "120"}) {
        try {
            int score = parse_score(text);
            std::printf("OK %d\n", score);
        } catch (const std::exception& problem) {
            std::printf("NG %s\n", problem.what());
        }
    }
    return 0;
}
```

By the way, if the Python version simply used `backup = alice` instead of `backup = copy.deepcopy(alice)`, then `backup` would point to the same object, so the second line would become `backup: 89.0`.

</details>

### Eliminating Ambiguity

In Quidra, **each symbol or keyword has only one meaning**.

| Syntax | Meaning |
|---|---|
| `=` | Copy a value (assign as an independent value) |
| `&x` | Explicitly operate on variable `x` itself rather than a copy |
| `T &` | Writable reference |
| `const T &` | Read-only reference |
| `T \| none` | The type explicitly includes "no value" |
| `T \| error` | The type explicitly includes "failure" |
| `try` | Propagate `error` to the caller (and nothing else) |
| `T(value)` | Explicit type conversion (when `T` is numeric; for classes, `T(...)` is a constructor call) |
| `and` / `or` / `not` | Logical operations (bool only) |
| `AND` / `OR` / `XOR` / `NOT` / `<<` / `>>` | Bitwise operations (fixed-width integers only) |
| `match` | Branching that must exhaustively handle every case |

Let's look at these concretely.

#### Pass by Reference or Pass by Value: `f(x)` vs. `f(&x)`

In C++, a function that modifies its argument and one that does not look exactly the same at the call site.

```cpp
void add_one(int& value) { value += 1; }  // Modifies
void show(int value) { /* ... */ }        // Does not modify

add_one(count);  // At the call site,
show(count);     // they look exactly the same
```

In Quidra, if a function modifies an argument, **the call site must also include `&`**.

```quidra:ref.qui
void add_one(int &value)
    value += 1

int count = 1
add_one(&count)
print(count)
```

```text:Output
2
```

If you forget the `&`, it becomes a compile error.

```text
ref.qui:5:9: error[WRITE_CAPABILITY] Argument reference form must match parameter.
```

Conversely, adding `&` when calling a by-value parameter causes the same error.
That means **an argument without `&` is guaranteed to be unmodifiable by the callee**.
Likewise, attempting to write through a read-only reference (`const int &`) is a compile error.

#### Assignment Copies Values; References Are Explicit with `&`

```quidra:copy.qui
int[] a = [1, 2, 3]
int[] b = a
b[0] = 9
print("a[0] = {a[0]}, b[0] = {b[0]}")

int[] &c = &a
c[0] = 7
print("a[0] = {a[0]}, c[0] = {c[0]}")
```

```text:Output
a[0] = 1, b[0] = 9
a[0] = 7, c[0] = 7
```

`b = a` is a copy, so modifying `b` does not change `a`.
Only when you want a reference do you write it explicitly on both the type and right-hand side, as in `int[] &c = &a`.
In Python, `b = a` shares the same list, so `b[0] = 9` also changes `a[0]`.

#### No Implicit Type Conversions

```quidra
int big = 300
int8 small = big
```

```text
error[TYPE_MISMATCH] Expected int8 but received int.
```

If you want to change the type, you must write it explicitly, such as `int8(big)`.
Even then, if the value is out of range, **execution stops with a runtime error; the value never silently wraps around**.

```text
Quidra runtime error[NUMERIC_CAST_RANGE] at 2:14: numeric cast outside destination range
```

In C++, the same code compiles without even a warning and silently changes the value.

```cpp
int big = 300;
int8_t small = big;  // No warning even with -Wall -Wextra; small becomes 44
```

Similarly, adding an `int` and a `float` is an error unless you write the conversion explicitly, such as `float(i) + d`. Converting from `float` to `int` requires you to specify **even the rounding method**, such as `math.round` or `math.floor`.

#### Representing "Failure" and "No Value" in the Type

```quidra:parse.qui
int | error parse_twice(string text)
    int value = try int.parse(text)
    return value * 2

for text in ["21", "12abc"]
    match parse_twice(text)
        int doubled
            print(doubled)
        error problem
            print("NG: {problem}")
```

```text:Output
42
NG: numeric parse failed
```

`try` propagates only `error` to the caller.
If you omit a branch in `match`, compilation fails with `error[MATCH_EXHAUSTIVE]`.
Likewise, if you receive the result directly without `match`, such as `int doubled = parse_twice(text)`, failure is not silently ignored: execution stops at that line with a runtime error.

Incidentally, C++'s `std::stoi("12abc")` **silently returns `12`**.
Python's `int("12abc")` does throw an exception, but simply looking at the function's type does not tell you that an exception may occur.

#### Separating Logical and Bitwise Operations

Quidra has no `&&`, `||`, or `!`.
Logical operators are `and` / `or` / `not`, while bitwise operators are uppercase `AND` / `OR` / `XOR` / `NOT`.

```quidra:permission.qui
uint8 can_read = 4
uint8 can_write = 2
uint8 can_run = 1

uint8 permission = can_read OR can_write
bool writable = (permission AND can_write) != 0
bool runnable = (permission AND can_run) != 0

print(bin(permission))
if writable and not runnable
    print("read/write only")
print(bin(permission << 1))
print(bin(NOT permission))
```

```text:Output
00000110
read/write only
00001100
11111001
```

Using `and` with `uint8`, or `AND` with `bool`, is a type error.
You also cannot use an integer directly as a condition, such as `if count` (only `bool` can be used as a condition).

#### Shadowing Is Forbidden

```quidra
int total = 0
for i in range(3)
    int total = i
```

```text
error[SHADOWING] Name is already visible or reserved.
```

An inner scope cannot hide a name from an outer scope.
So even if you later add nearby code, the target referenced by an earlier name cannot silently change.

### Eliminating Redundancy

Let's start with the classic Hello World.

```quidra:hello.qui
print("Hello, World!")
```

| Language | Lines (excluding blank lines) | Tokens |
|---|---:|---:|
| **Quidra** | 1 | **4** |
| Python | 1 | 4 |
| C++ | 5 | 20 |
| Java | 5 | 26 |

You do not need a `main` function like in C++ or Java, nor `#include`, nor a class.
There are several other things you do not have to write:

- **No `main` required**: execution proceeds from top to bottom. In fact, defining a function named `main` is an error.
- **No `{}` or `;` required**: blocks are expressed with indentation. Indentation is **fixed to four spaces**, so tabs or two-space indentation are errors, eliminating stylistic variation.
- **`print` automatically adds a newline**: use `write` when you do not want a newline. There is no escape sequence such as `\n`; a backslash is just a character, so Windows paths can be written as-is. When you need a newline character, write `{ENTER}`.
- **No `self` or `this` required**: inside a method, fields can be read and written directly.
- **Type inference with `auto`**: a type can be inferred from an expression whose type is unambiguous, such as `auto doubled = count * 2`.

```quidra:newline.qui
print("first line")
print("second line")
write("no newline")
write("continues here")
print("")
print("first{ENTER}second")
print("C:\Users\quidra\notes.txt")
```

```text:Output
first line
second line
no newlinecontinues here
first
second
C:\Users\quidra\notes.txt
```

By the way, `auto count = 3` is an error.
Quidra will not arbitrarily decide whether `3` is an `int` or an `int8`; that is another example of eliminating ambiguity.

## Benchmark

I also ran benchmarks using existing programming languages.
The ten languages compared were Python, C++, Rust, Go, Java, TypeScript, Kotlin, Swift, Zig, and Quidra.
I evaluated them from the following five perspectives.

| Evaluation | Roughly speaking |
|---|---|
| Semantic compression performance | How much definite meaning can be packed into each token |
| Language quality | Execution speed, file size, safety, and language design |
| LLM learnability | Whether an LLM given the specification can learn and use the language's rules |
| LLM practical usability | Whether an LLM can write practical programs without being given any materials |
| Ecosystem | Libraries, tools, and community maturity |

Parts that can be evaluated deterministically—execution speed, file size, safety tests, compiling and testing LLM-generated code, and so on—are handled mechanically (shell execution and Python scripts). Parts that are non-deterministic, such as annotating the meaning of code and evaluating language design, parts that require search such as ecosystem research, and items specifically intended to measure whether an LLM can use the language are handled by LLMs.
Score aggregation, normalization, and ranking are done by scripts (although the scores for each LLM learnability condition and some metrics in LLM practical usability are values assigned directly by an LLM according to a rubric).
Also, because these five evaluations are fundamentally different in nature, I intentionally did not create an overall ranking that simply sums them all together.

I mainly used Claude Sonnet 5 as the LLM.
Of course, I used the API so one session could not peek at another session.
More specifically, one LLM worker (one LLM session responsible for evaluation work) basically handles only one language, and it runs inside a Docker container with networking disabled, so it cannot see results from other languages or past runs (only the ecosystem evaluation has web search enabled).
(I only wanted to run a benchmark, but somehow I ended up spending tens of thousands of yen... 😭)

I also designed the benchmark around rules like these so it would not favor Quidra:

- The metrics, weights, and tasks are **fixed before measurement**
- Tasks are not created from Quidra's syntax or features. **Features Quidra cannot implement are not removed from the task set**
- There are no Quidra-specific metrics; the same rules are applied to all ten languages

The benchmark methodology and detailed results—including score breakdowns for each metric and the reasoning behind LLM judgments—are published in the repository.

### Summary of Results

To summarize the results first:

![00_overview.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/fbc928d5-f3b0-41d6-9c37-3423f26bed36.png)

| Evaluation | Quidra score | Rank | 1st place |
|---|---:|:---:|---|
| Semantic compression performance | 77.52 | **2nd** | Zig (78.48) |
| Language quality | 66.13 | **4th** | Rust (72.24) |
| LLM learnability | 74.70 | 10th | Swift (100.00) |
| LLM practical usability | 5.32 | 9th | Python (90.13) |
| Ecosystem | 32.50 | 10th | Java (99.25) |

Roughly speaking, the result is that <font color="#e0245e">**the language itself (semantic compression and language quality) ranks near the top**</font>, while **compatibility with LLMs and the ecosystem still have a long way to go**.
Now let's look at the performance in detail.

### Semantic Compression Performance

This is the main event!

Semantic compression performance was measured using **44 tasks across 20 areas**—variable declarations, references, overflow, error handling, generics, concurrency, FFI (calling functions from other languages), and more.
For each of the ten languages, an LLM wrote the minimum code snippet needed for each task.
Then an LLM annotated those snippets with information such as "what meaning is determined locally?" and "how many possible interpretations remain?", and a script aggregated those counts.

There are six metrics.
The five metrics other than coverage (the "quality metrics" below) are normalized relatively so that the best language among the ten receives 100 and the worst receives 0.

| Metric | What it measures | Weight | Quidra |
|---|---|---:|---:|
| Semantic density | Number of meanings determined locally per token | 20% | **100 (1st)** |
| Uniqueness (semantic certainty) | How many interpretations remain from that single line alone | 25% | **100 (1st)** |
| Locality | How many times you need to look elsewhere to determine meaning | 20% | 34.45 (5th) |
| Hidden semantic cost | Things that happen even though they are not written (implicit conversions, etc.) | 20% | 81.48 (2nd) |
| Feature efficiency | Number of rules required per feature | 15% | 36.46 (7th) |
| Coverage | Percentage of the 44 tasks expressible with standard features | Harmonic mean | 81.82 (9th) |

#### Semantic Density

This measures how many meanings are determined locally—without looking elsewhere—per token.
For example, from `const int n = 7`, you can locally determine meanings such as "this is a value," "it cannot be reassigned," "it is initialized," and "it has type `int`."
Semantic density divides the number of such locally determined meanings by the token count.

Comparing the 31 tasks that all languages could express:

| Language | Determined meanings / tokens | Semantic density | Score |
|---|---:|---:|---:|
| **Quidra** | 133 / 808 | **0.1646** | **100** |
| Swift | 108 / 751 | 0.1438 | 70.49 |
| Zig | 121 / 893 | 0.1355 | 58.69 |
| Kotlin | 106 / 783 | 0.1354 | 58.52 |
| Go | 109 / 863 | 0.1263 | 45.65 |
| Rust | 117 / 1015 | 0.1153 | 29.99 |
| Python | 79 / 714 | 0.1106 | 23.42 |
| TypeScript | 90 / 884 | 0.1018 | 10.88 |
| C++ | 95 / 973 | 0.0976 | 4.96 |
| Java | 98 / 1041 | 0.0941 | 0 |

<font color="#e0245e">**Quidra ranks 1st in semantic density**</font>!
Python is interesting: it has the smallest token count (714), but it also has the fewest locally determined meanings (79), so its density is low.
This makes it clear that **shorter is not automatically better**.

※ The token counts were produced by an LLM, but as a sanity check I counted them again with a shared simple lexer (regular expressions) across all languages, and Quidra still ranked 1st. Note that because spaces and indentation are not counted, indentation-based languages such as Quidra and Python have a slight advantage because they do not need `{}`.

#### Uniqueness (Semantic Certainty)

This measures how many possible interpretations remain when looking at a single line—whether something is modified, whether it is copied, how it fails, how type conversion works, and so on.
If exactly one interpretation remains, it gets full credit.

Quidra was <font color="#e0245e">**the only language where all 31 tasks expressible by every language had exactly one remaining interpretation**</font>!

The C++ `func(x)` example from the beginning is also included in the benchmark.
Given an array `x`, a call `f(x)`, and then a read of `x[0]`, the benchmark counts how many possibilities remain from the call site alone: "read only?", "modified?", "resized?", "reference retained?", "copied?", and so on.

| Language | Remaining interpretations |
|---|---:|
| **Quidra** | **1** |
| Rust | 1 |
| Swift | 2 |
| Python | 3 |
| Go / Java / TypeScript | 4 |
| C++ / Kotlin / Zig | 6 |

In Quidra, the absence of `&` means it is passed by value and cannot be modified by the callee, so the meaning is determined uniquely.
In C++, value passing, reference passing, and const-reference passing all look the same at the call site, so all of those possibilities remain.
※ These counts are the LLM workers' annotations as-is. Because separate workers counted each language, there are some inconsistencies in counting even between similar languages such as Java and Kotlin.

The benchmark also evaluated overflow in `x += 1`. In Quidra it always stops with a runtime error (one interpretation), while Rust and Zig behave differently depending on build mode (two interpretations), and C++ is undefined behavior.

#### Locality, Hidden Semantic Cost, and Feature Efficiency

Quidra did not rank 1st in the remaining three metrics (locality and feature efficiency were especially weak).

- **Locality (5th, 34.45)**: how many times you need to look somewhere else—function declarations, type definitions, imported modules, standard-library specifications, and so on—to determine meaning. Of the 17 lookups counted for Quidra, 11 came from looking up declarations for variables that the task statement said were declared elsewhere. The remainder were standard-library guarantees such as "files are closed automatically" and "`task.all` preserves result order." However, whether those "predeclared variables" are counted varies by worker (Go did not count them, Swift counted them per variable), so I think this difference should be discounted somewhat. Zig ranked 1st.
- **Hidden semantic cost (2nd, 81.48)**: the number of things that happen even though they are not written, such as implicit type conversions or invisible mutation. Almost everything counted for Quidra was that runtime errors for overflow and out-of-bounds accesses are not visible from the syntax itself. Zig ranked 1st.
- **Feature efficiency (7th, 36.46)**: the number of rules needed per feature—syntactic forms, implicit rules, exceptional rules, and so on. Quidra was charged for language-wide implicit rules such as overflow checking and value copying, and special rules such as "`private` can only be attached to class members," resulting in about 1.8 rules per point (two points per task). Swift, which ranked 1st, used about 0.95.

#### Coverage

```
int a = 5
print(a)
```

If a language only had the `int` type and only a `print` function, of course its semantic compression performance would look high.
What matters is how many things the language can express **while preserving** strong semantic compression.

So I measured "coverage" as the **percentage of the 44 tasks (88 points total, two points per task) that can be expressed using only standard features**.
Tasks the language cannot express remain in the denominator, so languages with fewer features score lower.

| Language | Coverage |
|---|---:|
| C++ | 98.86 |
| Rust | 98.86 |
| Swift | 97.73 |
| Zig | 94.32 |
| Go | 90.91 |
| Java | 90.91 |
| Kotlin | 90.91 |
| TypeScript | 82.95 |
| **Quidra** | **81.82** |
| Python | 77.27 |

Quidra scored 81.82, placing 9th.
Honestly, this is its biggest weakness...
The tasks it could not express (or could only partially express) were:

- Closures that capture local variables
- Runtime dispatch through inheritance or interfaces (two tasks)
- Array slicing
- Sorting with a comparison function (descending sort)
- User-defined destructors
- Exporting a function callable from C
- (Partially) transforming optional values without `if` or `match`, and module-private `private` functions

On the other hand, references, overflow, error handling, concurrency, calling C functions, and so on received full credit.

Incidentally, if quality Q stayed unchanged and <font color="#e0245e">**Quidra could express just one more task, it would mathematically edge past Zig into 1st place in semantic compression performance**</font>, haha.
That said, the difference would only be 0.05 points, so rather than focusing on the exact rank, I think the important takeaway is: "quality Q is 1st, coverage is the problem."
Plenty of room to grow!

#### Overall Evaluation

I calculated **quality Q** as the weighted average of the five quality metrics, then took the harmonic mean of quality Q and coverage C as a measure of whether the language achieves semantic compression while still being feature-rich.

```math
\text{Overall Score} = \frac{2 \times Q \times C}{Q + C}
```

The harmonic mean makes it hard for the total to rise if only one side is high.
For example, C++ has coverage of 98.86 (tied for 1st), but quality Q is 11.36, so its overall score is 20.38 (last place).

The conclusion: Quidra placed 2nd. (Zig was 1st.)

![01_semantic_compression_overall.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/0c02803c-52fe-40dc-acbf-7217bda105b5.png)

| Rank | Language | Quality Q | Coverage C | Overall |
|---:|---|---:|---:|---:|
| 1 | Zig | 67.19 | 94.32 | 78.48 |
| 2 | **Quidra** | **73.66** | 81.82 | **77.52** |
| 3 | Swift | 63.99 | 97.73 | 77.34 |
| 4 | Go | 59.71 | 90.91 | 72.08 |
| 5 | Kotlin | 55.91 | 90.91 | 69.24 |
| 6 | Rust | 51.72 | 98.86 | 67.91 |
| 7 | Java | 37.88 | 90.91 | 53.48 |
| 8 | TypeScript | 33.96 | 82.95 | 48.19 |
| 9 | Python | 33.76 | 77.27 | 46.99 |
| 10 | C++ | 11.36 | 98.86 | 20.38 |

The important thing to notice is quality Q: <font color="#e0245e">**Quidra ranks 1st out of all ten languages in quality Q (73.66)**</font>!
Coverage drags it down, leaving it 2nd overall.
Plotting quality Q against coverage C gives this:

![02_semantic_compression_q_vs_c.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/d340f91d-de49-4edd-ad32-44c0b33a642c.png)

The gap between 2nd-place Quidra and 3rd-place Swift is only 0.18 points, and the gap to 1st-place Zig is only about one point, so I think it is reasonable to view **the top three languages as effectively neck-and-neck**.

### Language Quality

Language quality is evaluated in four categories: execution performance (25%), resources (18.75%), language design (25%), and safety (31.25%).
Execution performance, resources, and safety are measured mechanically; only language design is judged by an LLM using a fixed rubric.

The result was **66.13 for Quidra, placing 4th**.
Rust was 1st (72.24), Go 2nd (67.22), Zig 3rd (66.76), leaving a 0.63-point gap between Zig and Quidra.

| Category | Weight | Quidra | Rank | 1st |
|---|---:|---:|:---:|---|
| Execution performance | 25% | 47.38 | 5th | Zig (73.08) |
| Resources | 18.75% | 67.30 | 5th | Python (89.92) |
| Safety | 31.25% | 64.85 | 5th | Java (69.85) |
| Language design | 25% | 85.62 | 4th | Swift (93.12) |

#### Execution Speed (Execution Performance)

I implemented eleven kinds of processing—Fibonacci, factorial, integer arithmetic, floating-point arithmetic, dot product, matrix multiplication, merge sort, string processing, statistics, file I/O, and collections—using **the same algorithm and the same input** in every language, verified that the outputs were correct, and then measured execution time.
Each task was measured five times after two warm-up runs, and I used the median (measured in Docker containers on GitHub Actions).

| Task | Quidra | C++ | Rust | Go | Zig | Python |
|---|---:|---:|---:|---:|---:|---:|
| Fibonacci | 0.323 | 0.159 | 0.159 | 0.363 | 0.159 | 9.022 |
| Factorial | 0.904 | 0.903 | 0.903 | 0.874 | 0.935 | 10.802 |
| Integer arithmetic | 0.835 | 0.774 | 0.860 | 0.861 | 0.667 | 40.958 |
| Floating-point arithmetic | 1.274 | 1.222 | 1.272 | 1.310 | 1.266 | 58.243 |
| Dot product | 0.802 | 0.795 | 0.794 | 0.793 | 0.792 | 53.574 |
| Matrix multiplication | **1.212** | 1.338 | 1.345 | 1.999 | 1.359 | 48.128 |
| Merge sort | 1.519 | 0.567 | 0.776 | 0.787 | 0.575 | 36.322 |
| String processing | 1.145 | 0.736 | 0.781 | 0.808 | 0.775 | 21.814 |
| Statistics | 0.620 | 0.466 | 0.497 | 0.333 | 0.324 | 26.865 |
| File I/O | 12.492 | 0.428 | 0.563 | 0.629 | 0.278 | 3.089 |
| Collections | 1.311 | 0.521 | 0.344 | 0.476 | 0.302 | 3.387 |

(Units are seconds, measured from process start to process exit.)

<details><summary>Results for all 10 languages (click to expand)</summary>

| Task | Quidra | Python | C++ | Rust | Go | Java | TypeScript | Kotlin | Swift | Zig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Fibonacci | 0.323 | 9.022 | 0.159 | 0.159 | 0.363 | 0.286 | 0.731 | 0.302 | 0.325 | 0.159 |
| Factorial | 0.904 | 10.802 | 0.903 | 0.903 | 0.874 | 0.913 | 3.858 | 0.929 | 0.906 | 0.935 |
| Integer arithmetic | 0.835 | 40.958 | 0.774 | 0.860 | 0.861 | 0.773 | 6.175 | 0.781 | 0.840 | 0.667 |
| Floating-point arithmetic | 1.274 | 58.243 | 1.222 | 1.272 | 1.310 | 1.324 | 1.247 | 1.337 | 1.217 | 1.266 |
| Dot product | 0.802 | 53.574 | 0.795 | 0.794 | 0.793 | 0.873 | 0.926 | 0.880 | 0.799 | 0.792 |
| Matrix multiplication | 1.212 | 48.128 | 1.338 | 1.345 | 1.999 | 3.141 | 1.143 | 3.159 | 1.351 | 1.359 |
| Merge sort | 1.519 | 36.322 | 0.567 | 0.776 | 0.787 | 1.152 | 2.302 | 1.129 | 0.900 | 0.575 |
| String processing | 1.145 | 21.814 | 0.736 | 0.781 | 0.808 | 1.056 | 3.639 | 1.052 | 1.652 | 0.775 |
| Statistics | 0.620 | 26.865 | 0.466 | 0.497 | 0.333 | 0.810 | 0.891 | 0.845 | 0.520 | 0.324 |
| File I/O | 12.492 | 3.089 | 0.428 | 0.563 | 0.629 | 0.676 | 1.650 | 0.766 | 0.645 | 0.278 |
| Collections | 1.311 | 3.387 | 0.521 | 0.344 | 0.476 | 0.873 | 1.097 | 0.948 | 0.498 | 0.302 |

</details>

Summarizing the results:

- **For matrix multiplication, Quidra was faster than C++, Rust, and Zig!** (Quidra 1.212 s, C++ 1.338 s, Rust 1.345 s, Zig 1.359 s)
- Factorial, floating-point arithmetic, and dot product were about as fast as C++ (within 5%)
- Looking at the geometric mean across all eleven tasks, **Quidra was about 16.5x faster than Python**
- On the other hand, compared with C++, Quidra was about 1.85x slower by geometric mean (about 1.4x slower if file I/O is excluded)
- **File I/O took 12.49 seconds, about 45x slower than Zig**... it also used about 1.6 GB of memory, which is obviously wrong, so this definitely needs improvement 😭

Quidra was measured with integer-overflow and out-of-bounds checks **kept ON at all times**.
C++ (`-O2`) does not have those checks to begin with, while Rust (`-O`) and Zig (`ReleaseFast`) also run with overflow checking disabled, so Quidra has a handicap there.
On the other hand, Quidra internally uses Clang `-O3`, which is more aggressive than C++ `-O2`, so that may also contribute to differences such as the matrix multiplication result.

Startup time (Hello World execution time) was about 1.95 ms for Quidra, about the same as C++ (about 1.98 ms) and Go (about 1.93 ms).
Compared with JVM-based Java (about 30.8 ms) and Kotlin (about 50.1 ms), it starts quite quickly.

Build times were also 0.13-0.21 seconds for most programs, making Quidra the second fastest among languages that require compilation after Go (about 0.13 seconds).
For reference, C++ took 1.3-1.8 seconds, while Zig took about 15 seconds.
(In the scoring formula, Python gets a perfect score because it requires no build, while all compiled languages end up with almost zero points, so raw time is probably more informative here.)

#### File Size (Resources)

Here is the total source-code size of the same eleven programs, including comments, in bytes.

| Language | Total source code size |
|---|---:|
| Python | 24,671 |
| Go | 25,232 |
| **Quidra** | **26,002** |
| Kotlin | 28,210 |
| Rust | 29,337 |
| Java | 31,674 |
| Swift | 33,802 |
| C++ | 36,021 |
| Zig | 37,365 |
| TypeScript | 38,356 |

By score (the average size ratio per program), Quidra placed **2nd** behind Python (92.32), although Go has a slightly smaller total byte count.
Despite being statically typed, it can be written in almost the same amount of source code as Python!

Executable/artifact sizes were as follows.

| Language | Artifact | Size |
|---|---|---:|
| C++ | Executable | 16-37 KB |
| Swift | Executable | 27-51 KB |
| **Quidra** | **Executable** | **227-288 KB** |
| Go | Executable | 2.4-2.5 MB |
| Zig | Executable | 3.6-3.7 MB |
| Rust | Executable | 4.4 MB |
| Kotlin | .jar (runtime included) | 5.5 MB |
| Java | .class (requires a separate JVM) | 1.5-5.9 KB |
| TypeScript | .js (requires a separate Node.js runtime) | 1.6-5.2 KB |
| Python | None (runs source directly) | 0 |

Among languages that produce native executables, Quidra had the third-smallest artifacts after C++ and Swift.
However, its score was 1.70 (6th).
That is because the scoring formula uses Python's zero-byte artifact as the baseline. As a result, even C++, which produces the smallest native binaries, scores only around 17 points, while Go, Zig, and Rust, whose binaries are several megabytes, score below one point (none of the languages were stripped, and link strategies were left at their defaults, so treat these sizes as rough indicators).

#### Safety

I ran 37 "nasty programs" across all languages—integer overflow, narrowing conversions, out-of-bounds array access, division by zero, NaN, infinite recursion, malformed input, and more—and mechanically classified where each problem was caught: "compile time," "runtime with a detected error," "crash," "undefined behavior," or "silently produces the wrong result (silent bug)."

| Metric | Quidra | Rank |
|---|---:|:---:|
| Type safety | 74.58 | **1st** |
| Silent-bug resistance | 91.18 | **1st** |
| Debuggability | 66.67 | 2nd |
| Boundary safety | 54.55 | 3rd |
| Early error detection | 59.81 | 5th |
| Runtime safety | 41.67 | 5th |
| Memory safety | 44.44 | 7th |
| Malicious-input resistance | 50.71 | 8th |

<font color="#e0245e">**Type safety and silent-bug resistance both ranked 1st**</font>!
Across the 37 programs, Quidra had three silent bugs and zero cases of undefined behavior (C++ had 15 undefined-behavior cases and 11 silent bugs).
Quidra was also **the only language that stopped every integer-overflow and narrowing-conversion case, including runtime input patterns, with an error message**.
However, Rust and Zig were again measured in release builds (`-O` and `ReleaseFast`), where overflow checking is disabled. Rust debug builds and Zig `ReleaseSafe` would also stop these cases, so this difference is significantly influenced by the measurement conditions rather than the language alone.

Memory safety and runtime safety were relatively low, though.
The reason was out-of-bounds array access and infinite recursion cases. Quidra stops these with error codes, for example:

```text
Quidra runtime error[INDEX_BOUNDS] at 5:15: index -1 outside length 5
```

But this message did not match the regular expression used by the benchmark (such as `out of bounds`), so it was classified as a "crash."
Still, using more conventional wording is friendlier to readers too, so I want to improve this.

#### Language Design

Language design was judged by an LLM using a fixed rubric for each metric (five criteria, each scored on a 0-4 scale).
For these eight metrics, the evidence had previously been collected by Sonnet 5, and another model (GPT-5.6 Sol) re-scored it using the current rubric.

| Metric | Quidra | Rank |
|---|---:|---|
| Readability | 95 | **1st** (tied with Go) |
| Diagnostics (error messages) | 100 | **1st** (tied with Rust) |
| Dependency simplicity | 100 | **1st** (tied with Rust and Go) |
| Conciseness | 90 | 3rd (tied with Python and TypeScript) |
| Portability | 90 | 5th (tied with Python and Rust) |
| Expressiveness | 85 | 7th (tied with Java) |
| Interoperability with other languages (FFI) | 70 | 7th (tied with Python) |
| Concurrency | 55 | 10th |

For readability, the evaluation said that "types, writable references (`&`), control flow, and error propagation are explicit with few symbols." Error messages were praised for "stable error codes, source locations, and JSON output."
On the other hand, concurrency ranked last because Quidra has little beyond `task.all` and `atomic.Counter`, with no cancellation or channels.

### LLM Aptitude

I measured how easy the language is for LLMs to work with using two evaluations.

#### Learnability (LLM Learnability)

This evaluation gives an LLM the language specification (selected rules) and measures whether it can **learn the rules on the spot and write correct code**.
To prevent languages the model already knows from having an unfair advantage, keywords are replaced with meaningless words such as `glim` and `fenta`, and fictional rules are added.

| Condition | Description | Weight | Quidra |
|---|---|---:|---:|
| I1 | Replace keywords with fictional words | 20% | 96 |
| I2 | Also rename standard-library names | 20% | 71 |
| I3 | Change visible syntax such as delimiters | 15% | **100** |
| I4 | Learn and use a fictional new rule from the specification | 20% | **100** |
| I5 | Combine rules that were taught separately | 15% | 34 |
| I6 | Give familiar words unfamiliar meanings (e.g. swap `for` and `while`) | 10% | 12 |

The result was 74.70, placing 10th.
Quidra did well on I1-I4 (especially I3 and I4, both perfect), but dropped sharply on I5 and I6.
Looking at the failures, most were caused by the model falling back to C-family syntax—curly braces, semicolons, `for (int v : values)`, `void main()`, and so on.

**Note:** The I5 and I6 tasks were generated by language-specific LLM workers. For many other languages (Python, C++, Go, etc.), the task ended up being "implement the rules of a toy language using a language the model already knows," whereas for Quidra it became "combine Quidra's own syntax and write the solution in Quidra." This made the condition somewhat harsher for Quidra, so I hope you keep that in mind when reading the result.

#### Practical Usability (LLM Practical Usability)

This evaluation asks an LLM to **write practical programs without giving it any reference materials**.
The tasks were SVM (support vector machine), GMM (Gaussian mixture model), and automatic differentiation, each evaluated in two patterns—"implement from a specification" and "port from a C++ reference implementation"—with three trials per pattern, for a total of 18 trials.
If there was a compile error or test failure, the error was returned to the model and it could make up to three repairs.
Hidden tests that the LLM never saw were used to determine correctness.
The only Quidra information provided to the model was the language name and the build command.

The result was 5.32, placing 9th.
All 18 trials failed to compile on the first attempt, and even across 72 generations including repairs, **not a single program passed the tests**.
Most failures came from importing syntax from other languages. For example:

| What the LLM tends to write | Quidra compiler response |
|---|---|
| Define `int main()` | `error[RESERVED_MAIN] Function name 'main' is reserved.` |
| Write `import math` | `error[STANDARD_NAMESPACE_IMPORT] Standard namespace 'math' is always available and cannot be imported.` |
| Write Rust-style `fn add(a: i64, b: i64) -> i64` | `error[PARSE_ERROR] fn requires '<Result>' before its parameter list.` |
| Use C-style `{` blocks | `error[LEX_ERROR] Unexpected character in source.` |

Of course, Quidra had only recently been released, and Claude Sonnet 5 had not been trained on it, so it is reasonable that asking the model to write Quidra with no reference material produced zero working programs.

What's interesting is that **Zig also scored 4.00 (10th), with zero successful programs**.
Zig failed because the standard-library API in the latest version (0.16) differed from what the model remembered.
In other words, this evaluation strongly reflects "how well the model knows the language (and its latest version)" rather than merely "how easy the language is to write."
The difference between Quidra and Zig was due to discretion in LLM scoring, so in practical terms they are essentially tied.

In fact, most Quidra failures violated rules that were already documented in the LLM guide (`docs/spec/llm-guide.md`) or the language specification: top-level statements form the entry point, standard namespaces are not imported, blocks use four-space indentation, and return types come before function names.
In the future, I'd also like to evaluate a condition where the guide is provided.

### Ecosystem

Finally, the maturity of libraries, tools, community, and so on.
An LLM searched the web and scored the results using fixed criteria.

The result was **32.50 for Quidra, placing 10th** (external ecosystem 9.0, toolchain 56.0).
Since the language had only just been released, there were essentially no third-party libraries, production adoption, Q&A-site information, and so on.
Of course it came last, haha.

Even so, the official documentation, browser-based Playground, formatter, REPL, and lockfile that pins dependencies (with SHA-256 hashes) earned the toolchain a reasonable evaluation.
This is exactly where **I need everyone's help**!

### Benchmark Caveats

**Benchmark notes:**

- The rankings simply order the measured results from this benchmark; they do not claim statistical superiority.
- The code snippets and annotations used in the semantic-compression evaluation were produced by LLMs and were not all verified by compilation. Also, separate workers annotated each language and their counting methods differ slightly, so especially among the top three languages (Zig, Quidra, Swift), a single annotation can be enough to change the ranking.
- Execution speed was measured on shared GitHub Actions runners, so treat the results as comparisons within the same environment, not as absolute performance.
- The programs used for the language-quality evaluation (10 languages x 11 programs) were prepared by the author, including the Quidra versions. The same algorithms and inputs were used across languages, and output correctness was verified mechanically.
- LLM aptitude results depend strongly on the model used (Claude Sonnet 5) and its existing knowledge.

## What I Want to Do Next

This benchmark made Quidra's room for improvement very clear.

- **Increase coverage**: closures, interfaces (runtime dispatch), array slicing, sorting with comparison functions, and so on
- **Speed up file I/O**: being 45x slower than Zig is, well...
- **Make error messages more LLM-friendly**: for example, if someone writes `&&`, tell them "use `and`"
- **Grow the ecosystem**: libraries, editor extensions, and more

In particular, by the current calculation, adding support for just one more task would be enough to tie for 1st place in semantic compression performance, so I want to start there!

## Summary

I developed a language called Quidra with the goal of "Maximum Meaning Per Token."
When I benchmarked it against ten languages, <font color="#e0245e">**it placed 2nd in semantic compression performance (1st in quality Q alone, excluding coverage)**</font>, and 4th in language quality.
On the other hand, LLM prior knowledge and the ecosystem still have a long way to go, and those are areas I want to grow together with everyone from here.

Please give it a try!

- GitHub: https://github.com/quidra-lang/quidra
- Playground (no installation required; you can try type checking and formatting in the browser. Execution is done locally): https://quidra-lang.github.io/playground/

**I'm actively looking for collaborators too!** Stars, Issues, and PRs are all very welcome!
Thank you for reading all the way to the end!
