# Introducing Quidra, a New Programming Language

Hello!

This time, I'd like to introduce a new programming language I developed called **Quidra**.

https://github.com/quidra-lang/quidra

What is your favorite programming language? Mine is probably C++! I like that feeling that you're building something kind of dangerous, haha.

This time, I tried creating a programming language like that from scratch. Its name is **Quidra**, derived from the Latin word **Quidditas ("essence")**.

As the name suggests, I am developing it with the goal of stripping away everything unnecessary and leaving only the "essence" — in other words, **eliminating ambiguity while making the syntax as short as possible**.

In terms of classification, it is a **statically typed, compiled language** that generates native code with LLVM. That said, you can run a program immediately with a single command, `quidra main.qui`, much like Python, and there is also an interactive REPL whose internals use JIT compilation.

## Goals

- **To be the programming language with the highest semantic-compression performance**
  - This is the core idea. Maximizing this is the language's primary goal.
  - More concretely, the idea is to "eliminate ambiguity while making syntax as short as possible."
  - However, the goal is not to minimize character count like code golf. The point is: **fewer meaningless tokens, not fewer meaningful distinctions**.
  - The slogan is **Maximum Meaning Per Token**.
  - For example, in C++, looking at `func(x)` does not tell you whether `x` is passed by reference or by value. To know that, you have to inspect the function definition. Likewise, in Python, `y = x + 1` does not determine the types of `x` or `y`. To find them, you may need to trace earlier lines or print the values. In that sense, these expressions have high ambiguity.
  - C++ also requires constructs such as `int main`, even though a Python-like model that simply executes top-level code in order can work without it. Braces such as `{}` are also unnecessary if indentation distinguishes blocks, as in Python. In this sense, C++ syntax has high redundancy.
  - Quidra's philosophy is to eliminate as much of this ambiguity and redundancy in existing programming languages as possible.
- **To have an impact on the scale of Python or C++**
  - I do not want Quidra to end as merely a hobby language. Ultimately, I want it to become as well known as other mainstream programming languages.
  - I also want to build it together with other people, not by myself. **I am looking for collaborators who agree with its design philosophy and ideas!**
- **To be easy for both humans and LLMs to read**
  - First, Quidra uses natural-language words that people already use. It is not simply a copy of existing programming languages: there is no `\n`, and no `&&`, for example. Quidra uses `and` instead of `&&`, and `print` automatically appends a newline.
  - As a side effect of semantic compression, I also want to reduce LLM input/output token consumption: code is shorter, while a single line contains enough information to understand what it does. Common English words are often represented by a single token, so I believe "natural language while still being easy for LLMs to handle" is achievable.
- **To be easy for newcomers to learn**
  - Python can express addition very simply with `y = x + 1`, so it is approachable for beginners. But when you want to do more complex work, you eventually need to learn (1) types and the value ranges of those types, (2) address/reference semantics — what is passed by value and what can be modified — and (3) bit operations. When learning more deeply, Python's exceptional syntax and black-box behavior can become harder to understand for intermediate and long-term learners.
  - C++ — or rather C — is almost the opposite. You need to understand types, address/reference semantics, and bit operations from the beginning. That can make the underlying model easier to understand for intermediate and long-term learners. However, even something as simple as modifying array values inside a function may require learning relatively difficult concepts such as pointer manipulation, which makes it harder for beginners.
  - I therefore want Quidra to work well across the beginner, intermediate, and long-term stages. Concretely: it should be relatively ceremony-free and easy to write like Python, while retaining explicit types so it is easier to understand what happens internally; complicated pointer manipulation should be replaced by mechanisms such as C++-style references, while still allowing users to learn the concept of addresses; and of course bit operations should be available.
  - Assignment of arrays and classes with `a = b` is value-based by default, meaning the value is copied. If you only want to refer to an array or class, you explicitly write something such as `int[] &a = &b`. Internally, the compiler is allowed to eliminate a copy when doing so cannot change the result. For example, when an array is passed to a function that does not modify the argument, Quidra already refers to it internally without copying. In other words, the user-facing semantics are value semantics, while the implementation can optimize them. I designed choices like this by thinking back to when I had just started learning programming and choosing the behavior that felt more intuitive.
  - Ultimately, I would love to see Quidra used as the first programming language taught in university courses.

## Overview of Quidra

Quidra's primary goal is **Maximum Meaning Per Token**.

Let's look at some actual examples.

**Note:** The code in this article has been verified with Quidra 0.3.0 (language specification 0.2). Version 0.3.0 is currently on the `develop` branch. Some code will not work with the latest released version or the Playground (0.2 series), so build from `develop` if you want to try it.

### Example Program

Here is a program that handles student grades. I packed in several characteristic Quidra features: classes, functions that can fail, pass-by-reference, and more.

```quidra
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
        return float(total) / float(len(scores)) // int → float is explicit

// A function that can fail includes error in its return type
int | error parse_score(string text)
    int score = try int.parse(text) // propagate error to the caller on failure
    if score < 0 or score > 100
        return error("out of range: {text}")
    return score

// int[] & = permission to modify the caller's array
void add_bonus(int[] &scores, int bonus)
    for &score in scores
        score = math.min(score + bonus, 100)

Student alice = Student("Alice", [72, 85, 98])
Student backup = alice // value copy (changing alice does not change backup)
add_bonus(&alice.scores, 5) // & also tells the caller that the original is passed

print("{alice.name}: {alice.average():frac=1}")
print("backup: {backup.average():frac=1}")

for text in ["88", "abc", "120"]
    match parse_score(text) // both int and error must be handled
        int score
            print("OK {score}")
        error problem
            print("NG {problem}")
```

```text
Alice: 89.0
backup: 85.0
OK 88
NG numeric parse failed
NG out of range: 120
```

A few points:

- With `int | error`, **a function that may fail says so in its return type**. There are no exceptions secretly flying around behind the scenes.
- The `&` in `add_bonus(&alice.scores, 5)` means **the original object is being passed rather than a copy**. Conversely, if an argument does not have `&`, the caller can determine from the call site alone that **the callee absolutely cannot modify it**.
- `Student backup = alice` copies the value, so changing `alice` does not change `backup`.
- A `match` does not compile unless both `int` and `error` are handled.

I wrote the same operation in Python and C++ and compared token counts. Comments were excluded and a simple lexer was used; a string literal, including embedded expressions, counts as one token.

| Language | Lines (excluding blanks/comments) | Tokens |
|---|---:|---:|
| **Quidra** | 30 | **177** |
| Python (without type hints) | 26 | 178 |
| Python (with type hints) | 26 | 200 |
| C++ | 38 | 296 |

Quidra explicitly writes **static types, mutation capability (`&`), and the possibility of failure (`int | error`)**, yet uses almost the same number of tokens as Python without type hints. Compared with C++, it uses roughly 30–40% fewer tokens, depending on whether the contents of embedded string expressions such as `{…}` are counted.

<details><summary>Python and C++ versions (click to expand)</summary>

```python
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

```cpp
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

If the Python version used the seemingly natural `backup = alice` instead of `backup = copy.deepcopy(alice)`, `backup` would refer to the same object, and the second line would become `backup: 89.0`.

</details>

### Eliminating Ambiguity

In Quidra, **one symbol or keyword has one meaning**.

| Syntax | Meaning |
|---|---|
| `=` | Copy a value (assign as an independent value) |
| `&x` | Explicitly operate on variable `x` itself rather than a copy |
| `T &` | Mutable reference |
| `const T &` | Read-only reference |
| `T \| none` | The type includes the absence of a value |
| `T \| error` | The type includes failure |
| `try` | Propagate `error` to the caller, and nothing else |
| `T(value)` | Explicit type conversion when `T` is numeric; for classes, `T(...)` is a constructor call |
| `and` / `or` / `not` | Logical operations, for bool only |
| `AND` / `OR` / `XOR` / `NOT` / `<<` / `>>` | Bitwise operations, for fixed-width integers only |
| `match` | Branching that must exhaustively handle all cases |

#### Pass by Reference or by Value: `f(x)` vs. `f(&x)`

In C++, functions that modify an argument and functions that do not look identical at the call site.

```cpp
void add_one(int& value) { value += 1; }
void show(int value) { /* ... */ }

add_one(count);
show(count);
```

In Quidra, if a function modifies an argument, the **caller must also use `&`**.

```quidra
void add_one(int &value)
    value += 1

int count = 1
add_one(&count)
print(count)
```

```text
2
```

If `&` is omitted, compilation fails:

```text
ref.qui:5:9: error[WRITE_CAPABILITY] Argument reference form must match parameter.
```

Adding `&` to a value parameter produces the same error. Therefore, **an argument without `&` can never be modified by the callee**. Writing through a read-only reference such as `const int &` is also a compile-time error.

#### Assignment Copies Values; References Are Explicit with `&`

```quidra
int[] a = [1, 2, 3]
int[] b = a
b[0] = 9
print("a[0] = {a[0]}, b[0] = {b[0]}")

int[] &c = &a
c[0] = 7
print("a[0] = {a[0]}, c[0] = {c[0]}")
```

```text
a[0] = 1, b[0] = 9
a[0] = 7, c[0] = 7
```

Because `b = a` is a copy, modifying `b` does not change `a`. Only when you want a reference do you explicitly put `&` in both the type and the right-hand side, as in `int[] &c = &a`. In Python, `b = a` shares the same list, so `b[0] = 9` also changes `a[0]`.

#### No Implicit Type Conversions

```quidra
int big = 300
int8 small = big
```

```text
error[TYPE_MISMATCH] Expected int8 but received int.
```

To change the type, write it explicitly, for example `int8(big)`. Even then, if the value is out of range, Quidra **stops with a runtime error rather than silently wrapping**.

```text
Quidra runtime error[NUMERIC_CAST_RANGE] at 2:14: numeric cast outside destination range
```

The equivalent C++ code compiles without even a warning under `-Wall -Wextra`, and the value silently changes:

```cpp
int big = 300;
int8_t small = big;  // small becomes 44
```

Similarly, adding an `int` and `float` requires an explicit expression such as `float(i) + d`, and converting `float` to `int` requires explicitly choosing the rounding method, such as `math.round` or `math.floor`.

#### Representing "Failure" and "No Value" in the Type

```quidra
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

```text
42
NG: numeric parse failed
```

`try` propagates only `error` to the caller. If a branch is omitted from `match`, compilation fails with `error[MATCH_EXHAUSTIVE]`. If you skip `match` and write something like `int doubled = parse_twice(text)`, failure is not silently ignored; execution stops with a runtime error on that line.

Incidentally, C++'s `std::stoi("12abc")` **silently returns `12`**. Python's `int("12abc")` raises an exception, but the function's type alone does not tell you that an exception may be thrown.

#### Separating Logical and Bitwise Operations

Quidra has no `&&`, `||`, or `!`. Logical operations use `and` / `or` / `not`; bitwise operations use uppercase `AND` / `OR` / `XOR` / `NOT`.

```quidra
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

```text
00000110
read/write only
00001100
11111001
```

Using `and` with `uint8`, or `AND` with `bool`, is a type error. An integer cannot be used directly as a condition either: `if count` is invalid because only `bool` can be a condition.

#### Shadowing Is Forbidden

```quidra
int total = 0
for i in range(3)
    int total = i
```

```text
error[SHADOWING] Name is already visible or reserved.
```

An inner scope cannot hide a name from an outer scope. Therefore, adding nearby code later cannot silently change which declaration an existing name refers to.

### Eliminating Redundancy

First, the obligatory Hello World:

```quidra
print("Hello, World!")
```

| Language | Lines | Tokens |
|---|---:|---:|
| **Quidra** | 1 | **4** |
| Python | 1 | 4 |
| C++ | 5 | 20 |
| Java | 5 | 26 |

There is no C++/Java-style `main` function, no `#include`, and no class wrapper.

- **No `main` required:** top-level code runs from top to bottom. In fact, defining a function named `main` is an error.
- **No `{}` or `;`:** blocks are represented by indentation. Indentation is fixed at **four spaces**; tabs or two-space indentation are errors, preventing stylistic variation.
- **`print` automatically adds a newline:** use `write` when you do not want one. There are no backslash escapes such as `\n`; a backslash is simply a character, so Windows paths can be written directly. Use `{ENTER}` when a newline character is needed.
- **No `self` or `this`:** fields can be read and written directly inside methods.
- **Type inference with `auto`:** expressions whose type is uniquely determined can be written as `auto doubled = count * 2`.

```quidra
print("line 1")
print("line 2")
write("no newline")
write("continues")
print("")
print("first{ENTER}second")
print("C:\Users\quidra\notes.txt")
```

```text
line 1
line 2
no newlinecontinues
first
second
C:\Users\quidra\notes.txt
```

On the other hand, `auto count = 3` is an error. Quidra does not arbitrarily decide whether `3` is an `int`, `int8`, and so on. That is another example of eliminating ambiguity.

## Benchmark

I benchmarked Quidra against nine existing programming languages: Python, C++, Rust, Go, Java, TypeScript, Kotlin, Swift, Zig, and Quidra — ten languages in total.

The evaluation uses five perspectives:

| Evaluation | Roughly speaking |
|---|---|
| Semantic compression | How much certain meaning can be packed into each token |
| Language quality | Runtime speed, file size, safety, and language design |
| LLM learnability | Whether an LLM given the specification can learn and use the language's rules |
| LLM proficiency | Whether an LLM can write practical programs without being given documentation |
| Ecosystem | Libraries, tools, and community maturity |

Deterministically measurable parts — runtime speed, file size, safety tests, compilation and testing of LLM-written code — are handled by machines (shell/Python execution). Non-deterministic parts, such as semantic annotation and language-design evaluation, ecosystem research that requires search, and measurements whose purpose is to test whether an LLM can use the language, are handled by LLMs.

Score aggregation, normalization, and ranking are performed by scripts. The per-condition scores for LLM learnability and some LLM proficiency metrics are exceptions: those use values assigned directly by the LLM according to a scoring rubric.

Because the five evaluations measure very different things, I deliberately do **not** create an overall ranking that simply adds all five together.

The LLM used was mainly Claude Sonnet 5. Of course, I used the API so that sessions could not peek at one another. In general, one LLM worker session handles only one language, and it runs inside a Docker container with networking disabled, so it cannot see other languages' results or previous runs. Only the ecosystem investigation has web search enabled.

(I only wanted to run a benchmark, but I ended up spending tens of thousands of yen... 😭)

To avoid designing an evaluation favorable to Quidra:

- Metrics, weights, and tasks are **fixed before measurement**.
- Tasks are not created from Quidra's syntax or features. **Features Quidra cannot implement are not removed from the tasks.**
- No Quidra-specific metrics are created; the same rules apply to all ten languages.

The repository publishes detailed methodology and results, including metric breakdowns and the LLMs' reasoning.

### Summary of Results

![Benchmark overview](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/fbc928d5-f3b0-41d6-9c37-3423f26bed36.png)

| Evaluation | Quidra score | Rank | #1 |
|---|---:|:---:|---|
| Semantic compression | 77.52 | **2nd** | Zig (78.48) |
| Language quality | 66.13 | **4th** | Rust (72.24) |
| LLM learnability | 74.70 | 10th | Swift (100.00) |
| LLM proficiency | 5.32 | 9th | Python (90.13) |
| Ecosystem | 32.50 | 10th | Java (99.25) |

In short, **the language itself — semantic compression and language quality — ranks near the top**, while **LLM compatibility and the ecosystem still have a long way to go**.

### Semantic Compression

This is the centerpiece of the benchmark.

I prepared **44 tasks across 20 areas**, including variable declarations, references, overflow, error handling, generics, concurrency, and FFI, and had an LLM write minimal code fragments in each of the ten languages.

For each fragment, the LLM annotated questions such as "what meaning is determined locally?" and "how many interpretations remain?", and scripts aggregate those annotations.

There are six metrics. The five quality metrics other than coverage are normalized so that the best language among the ten receives 100 and the worst receives 0.

| Metric | What it measures | Weight | Quidra |
|---|---|---:|---:|
| Semantic density | Locally determined meanings per token | 20% | **100 (1st)** |
| Uniqueness | How many interpretations remain from that line alone | 25% | **100 (1st)** |
| Locality | How often another location must be inspected to determine meaning | 20% | 34.45 (5th) |
| Hidden semantic cost | Things that happen despite not being written, such as implicit conversions | 20% | 81.48 (2nd) |
| Feature efficiency | Number of rules needed per feature | 15% | 36.46 (7th) |
| Coverage | Share of the 44 tasks expressible with standard features | harmonic mean | 81.82 (9th) |

#### Semantic Density

This is the number of meanings determined locally, without looking elsewhere, per token. For example, `const int n = 7` tells us locally that it is a value, cannot be reassigned, is initialized, and has type `int`.

Across the 31 tasks that every language could express:

| Language | Determined meanings / tokens | Density | Score |
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

**Quidra ranked #1 in semantic density.**

Python is interesting: it has the fewest tokens (714), but also the fewest locally determined meanings (79), so its density is low. This illustrates that **shorter is not automatically better**.

The token counts above were produced by the LLM, but I also recounted all languages with a common simple regex lexer and Quidra remained #1. Whitespace and indentation are not counted, so indentation-based languages such as Quidra and Python have a slight advantage from not needing braces.

#### Uniqueness

This measures how many interpretations remain when looking at only one line: whether something is modified, copied, can fail, how conversion works, and so on. One remaining interpretation is a perfect score.

**Quidra was the only language for which all 31 tasks shared by every language had exactly one remaining interpretation.**

The earlier C++ `func(x)` example is also measured in the benchmark. An array `x` is created, `f(x)` is called, and then `x[0]` is read. The benchmark counts how many possibilities remain from the call site alone — read-only, mutation, resizing, retaining a reference, copying, etc.

| Language | Remaining interpretations |
|---|---:|
| **Quidra** | **1** |
| Rust | 1 |
| Swift | 2 |
| Python | 3 |
| Go / Java / TypeScript | 4 |
| C++ / Kotlin / Zig | 6 |

Quidra has no `&` at the call site in this case, so it is determined to be value-passing and non-mutable from the callee. C++, on the other hand, has identical call syntax for value, reference, and const-reference parameters, so all possibilities remain.

These counts are the LLM workers' annotations as-is. Different workers handled different languages, so there is some annotation variance even between similar languages such as Java and Kotlin.

For overflow in `x += 1`, Quidra was judged to have one behavior — always stop with a runtime error — whereas Rust and Zig can behave differently depending on build mode, and C++ was judged as undefined behavior.

#### Locality, Hidden Semantic Cost, and Feature Efficiency

Quidra did not rank first in the remaining three quality metrics.

- **Locality (5th, 34.45):** how many times another location — function declaration, type definition, import target, standard-library specification, etc. — must be consulted. Of the 17 lookups counted for Quidra, 11 were for variables that the task statement said had been declared elsewhere. The remainder were standard-library guarantees such as automatic file closing and `task.all` preserving result order. Workers were inconsistent about whether to count those declared variables, so this difference should be interpreted cautiously. Zig ranked first.
- **Hidden semantic cost (2nd, 81.48):** counts things that happen despite not being written, such as implicit conversions or invisible mutation. For Quidra, almost all counted cases were runtime errors for overflow or out-of-bounds access that are not visible from syntax. Zig ranked first.
- **Feature efficiency (7th, 36.46):** counts the number of rules — syntax forms, implicit rules, exceptional rules — needed per feature. Quidra was charged for language-wide implicit rules such as overflow checks and value copying, and exceptional rules such as `private` only being valid on class members. It needed about 1.8 rules per point, versus about 0.95 for first-place Swift.

#### Coverage

A language with only an `int` type and a `print` function could trivially have excellent semantic compression. What matters is how much can be expressed while retaining that compression.

Coverage is therefore the percentage of the 44 tasks (88 points total) expressible using only standard features.

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

Quidra scored 81.82, ranking 9th. This is honestly its biggest weakness.

Tasks that could not be expressed, or could only be partially expressed, included:

- Closures that capture local variables
- Runtime dispatch through inheritance or interfaces (two tasks)
- Array slicing
- Sorting with a custom comparison function (descending sort)
- User-defined destructors
- Exporting functions callable from C
- Partially: transforming optional values without `if` or `match`, and module-private functions

References, overflow, error handling, concurrency, and calling C functions all received full credit.

Interestingly, **if Quidra could express just one more task while keeping quality Q unchanged, it would mathematically edge past Zig for #1 in semantic compression**. The difference is only about 0.05 points, though, so the more useful conclusion is that quality Q is #1 while coverage remains the major issue.

#### Overall Semantic-Compression Score

The weighted average of the five quality metrics is **quality Q**. The final score is the harmonic mean of Q and coverage C:

```math
\text{Overall Score} = \frac{2 \times Q \times C}{Q + C}
```

The harmonic mean prevents a language from scoring highly when only one side is strong. C++, for example, has coverage 98.86 but quality Q 11.36, producing an overall score of 20.38.

Quidra ranked second, behind Zig.

![Semantic compression overall](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/0c02803c-52fe-40dc-acbf-7217bda105b5.png)

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

The important part is quality Q: **Quidra ranked #1 out of all ten languages at 73.66**. Coverage pulled the final score down to second.

![Quality Q vs Coverage C](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/d340f91d-de49-4edd-ad32-44c0b33a642c.png)

Quidra and third-place Swift differ by only 0.18 points, and Zig is only about one point ahead, so it is reasonable to view the top three as essentially neck-and-neck.

### Language Quality

Language quality consists of runtime performance (25%), resources (18.75%), language design (25%), and safety (31.25%). Runtime performance, resources, and safety are machine-measured; only language design is judged by an LLM using a fixed rubric.

**Quidra scored 66.13 and ranked 4th.** Rust was first at 72.24, Go second at 67.22, and Zig third at 66.76 — only 0.63 points ahead of Quidra.

| Category | Weight | Quidra | Rank | #1 |
|---|---:|---:|:---:|---|
| Runtime performance | 25% | 47.38 | 5th | Zig (73.08) |
| Resources | 18.75% | 67.30 | 5th | Python (89.92) |
| Safety | 31.25% | 64.85 | 5th | Java (69.85) |
| Language design | 25% | 85.62 | 4th | Swift (93.12) |

#### Runtime Speed

I implemented 11 workloads — Fibonacci, factorial, integer arithmetic, floating-point arithmetic, dot product, matrix multiplication, merge sort, string processing, statistics, file I/O, and collections — using the **same algorithm and input** in every language. Output correctness was checked before timing. Each workload had two warm-up runs followed by five measurements; the median was used. Measurements ran in Docker containers on GitHub Actions.

| Workload | Quidra | C++ | Rust | Go | Zig | Python |
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

Times are in seconds, from process start to exit.

<details><summary>Results for all ten languages</summary>

| Workload | Quidra | Python | C++ | Rust | Go | Java | TypeScript | Kotlin | Swift | Zig |
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

In summary:

- **Matrix multiplication was faster than C++, Rust, and Zig:** Quidra 1.212 s, C++ 1.338 s, Rust 1.345 s, Zig 1.359 s.
- Factorial, floating-point arithmetic, and dot product were within 5% of C++.
- Across all 11 workloads, the geometric mean makes Quidra **about 16.5× faster than Python**.
- Compared with C++, Quidra is about 1.85× slower by geometric mean, or about 1.4× slower if file I/O is excluded.
- **File I/O took 12.49 seconds, roughly 45× slower than Zig.** It also used around 1.6 GB of memory, which is clearly abnormal and badly needs improvement.

Quidra was measured with integer-overflow and array-bounds checks **always enabled**. C++ with `-O2` does not have these checks in the first place, while Rust `-O` and Zig `ReleaseFast` also disable overflow checks, so Quidra has some disadvantage there. On the other hand, Quidra internally uses Clang `-O3`, stronger optimization than the C++ `-O2` configuration, which may contribute to results such as matrix multiplication.

Hello World startup time was about 1.95 ms, comparable to C++ (about 1.98 ms) and Go (about 1.93 ms), and much faster than JVM-based Java (about 30.8 ms) or Kotlin (about 50.1 ms).

Build time was 0.13–0.21 seconds for most programs, second only to Go (about 0.13 seconds) among languages requiring compilation. C++ took 1.3–1.8 seconds and Zig about 15 seconds. The scoring formula gives full marks to build-free Python and nearly zero to all compiled languages, so the raw times are more informative here.

#### File Size / Resources

Total source size for the same 11 programs, including comments:

| Language | Total source bytes |
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

By score — the average size ratio per program — Quidra ranked **2nd behind Python** at 92.32, although Go's total bytes are slightly smaller. Quidra is statically typed yet can be written in almost the same amount of source as Python.

Executable/artifact sizes:

| Language | Artifact | Size |
|---|---|---:|
| C++ | executable | 16–37 KB |
| Swift | executable | 27–51 KB |
| **Quidra** | **executable** | **227–288 KB** |
| Go | executable | 2.4–2.5 MB |
| Zig | executable | 3.6–3.7 MB |
| Rust | executable | 4.4 MB |
| Kotlin | .jar including runtime | 5.5 MB |
| Java | .class, JVM required separately | 1.5–5.9 KB |
| TypeScript | .js, Node.js required separately | 1.6–5.2 KB |
| Python | none; runs from source | 0 |

Among languages producing native executables, Quidra had the third-smallest artifacts after C++ and Swift. Its score was nevertheless only 1.70 (6th) because the formula uses Python's zero-byte artifact as the reference; even C++ scores only around 17, while multi-megabyte Go, Zig, and Rust artifacts score below 1. No language used stripping and link settings were left at defaults, so these sizes are only rough indicators.

#### Safety

I ran 37 "nasty programs" in every language: integer overflow, narrowing conversions, out-of-bounds access, division by zero, NaN, infinite recursion, malformed input, and more. A machine classifier determined whether each problem was caught at compile time, detected and stopped at runtime, crashed, invoked undefined behavior, or silently produced a wrong result.

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

**Quidra ranked #1 in type safety and silent-bug resistance.** Across the 37 programs, it produced three silent bugs and zero undefined-behavior cases. C++ produced 15 undefined-behavior cases and 11 silent bugs.

Quidra was also the only language that stopped **every tested runtime input pattern for integer overflow and narrowing conversion with an error message**. Rust and Zig were measured in release configurations (`-O` and `ReleaseFast`) with overflow checks disabled; Rust debug builds or Zig `ReleaseSafe` would stop these cases too, so measurement configuration matters here.

Memory and runtime safety scores were lower. In out-of-bounds and infinite-recursion cases, Quidra actually stopped with error codes such as:

```text
Quidra runtime error[INDEX_BOUNDS] at 5:15: index -1 outside length 5
```

However, the classifier's regex expected phrases such as `out of bounds`, so these were classified as "crashes." Using more conventional wording would be friendlier to humans too, so I want to improve this.

#### Language Design

Language design was scored by an LLM using fixed rubrics: five criteria per metric, each scored from 0 to 4. These eight metrics were re-evaluated under the current rubric by another model (GPT-5.6 Sol), using evidence previously collected by Sonnet 5.

| Metric | Quidra | Rank |
|---|---:|---|
| Readability | 95 | **1st (tie with Go)** |
| Diagnostics | 100 | **1st (tie with Rust)** |
| Dependency simplicity | 100 | **1st (tie with Rust and Go)** |
| Conciseness | 90 | 3rd (tie with Python and TypeScript) |
| Portability | 90 | 5th (tie with Python and Rust) |
| Expressiveness | 85 | 7th (tie with Java) |
| FFI | 70 | 7th (tie with Python) |
| Concurrency | 55 | 10th |

Readability was praised because types, mutable references (`&`), control flow, and error propagation are explicit with relatively little punctuation. Diagnostics were praised for stable error codes, source positions, and JSON output.

Concurrency ranked last because Quidra currently has little beyond `task.all` and `atomic.Counter`, with no cancellation or channels.

### LLM Suitability

I measured whether the language is easy for LLMs to use in two ways.

#### Learnability

The LLM is given an excerpt of the language specification and asked whether it can **learn the rules on the spot and write correct code**. To reduce the advantage of languages already present in the model's training, keywords are replaced with meaningless words such as `glim` and `fenta`, and artificial rules are introduced.

| Condition | Description | Weight | Quidra |
|---|---|---:|---:|
| I1 | Replace keywords with invented words | 20% | 96 |
| I2 | Also rename standard-library names | 20% | 71 |
| I3 | Change visual grammar such as delimiters | 15% | **100** |
| I4 | Learn and use an invented new rule from the specification | 20% | **100** |
| I5 | Combine rules taught separately | 15% | 34 |
| I6 | Give familiar words unfamiliar meanings, e.g. swap `for` and `while` | 10% | 12 |

Quidra scored 74.70 and ranked 10th. It did well on I1–I4, with perfect scores on I3 and I4, but dropped sharply on I5 and I6.

Most failures were caused by the model falling back to C-family syntax: braces, semicolons, `for (int v : values)`, `void main()`, and similar patterns.

**Note:** For I5 and I6, workers created tasks separately for each language. For many languages such as Python, C++, and Go, the task was to implement the rules of a toy language using a familiar language, whereas Quidra's task required combining Quidra's own syntax. This made the Quidra condition somewhat harsher, so please keep that in mind when interpreting the result.

#### Proficiency

This evaluation gives the LLM **no documentation at all** and asks it to write practical programs.

The tasks are SVM, GMM, and automatic differentiation, each in two variants — implementation from a specification and porting from a C++ reference — with three trials each, for 18 trials total. Compilation or test failures are returned to the model, which can attempt up to three repairs. Hidden tests that the LLM cannot see are also used.

The only Quidra information given to the model was the language name and build command.

Quidra scored 5.32 and ranked 9th. The first generated program failed to compile in all 18 trials, and across 72 generations including repair attempts, **not a single program passed the tests**.

Most failures imported syntax from other languages:

| What the LLM tends to write | Quidra compiler response |
|---|---|
| Define `int main()` | `error[RESERVED_MAIN] Function name 'main' is reserved.` |
| Write `import math` | `error[STANDARD_NAMESPACE_IMPORT] Standard namespace 'math' is always available and cannot be imported.` |
| Rust-style `fn add(a: i64, b: i64) -> i64` | `error[PARSE_ERROR] fn requires '<Result>' before its parameter list.` |
| C-style braces | `error[LEX_ERROR] Unexpected character in source.` |

This result is natural: Quidra had only recently been released, and Claude Sonnet 5 had not learned it, so asking the model to write it from memory produced zero working programs.

Interestingly, **Zig also scored 4.00 (10th) and likewise produced zero successful programs**. Its failures were caused by the model remembering standard-library APIs that no longer matched the latest Zig 0.16. In other words, this evaluation reflects not only how easy a language is to write, but also how much the model knows about the language — especially its latest version. The small difference between Quidra and Zig comes from LLM grading discretion; practically speaking, they are tied.

Most Quidra failures violated rules already documented in the LLM guide (`docs/spec/llm-guide.md`) or language specification: top-level statements are the entry point, standard namespaces are not imported, blocks use four-space indentation, and return types come before function names.

In the future, I would also like to benchmark a condition where the guide is provided.

### Ecosystem

Finally, I evaluated libraries, tools, community maturity, and related factors. An LLM researched them through web search and scored the findings against fixed criteria.

**Quidra scored 32.50 and ranked 10th**: 9.0 for the external ecosystem and 56.0 for the toolchain.

Because the language had only recently been released, there were almost no third-party libraries, production adoption examples, or Q&A-site information. Last place is completely expected, haha.

Even so, the official documentation, browser-based Playground, formatter, REPL, and lockfile with SHA-256 hashes received some credit for the toolchain.

This is exactly the area where **I need everyone's help!**

### Benchmark Caveats

**Warning**

- The rankings simply order the measurements from this benchmark; they do not claim statistically significant superiority.
- Semantic-compression code fragments and annotations were produced by LLMs and were not compile-verified. Different workers annotated different languages, so counting conventions vary slightly. In particular, Zig, Quidra, and Swift are close enough that a single annotation can change the ordering.
- Runtime performance was measured on shared GitHub Actions runners. Treat it as a same-environment comparison, not an absolute speed measurement.
- The language-quality programs — 10 languages × 11 programs — were prepared by the author, including the Quidra versions. They use the same algorithms and inputs across languages, and outputs are machine-verified.
- LLM-suitability results strongly depend on the model used (Claude Sonnet 5) and what it already knows.

## What I Want to Do Next

The benchmark made Quidra's room for improvement very clear.

- **Increase coverage:** closures, interfaces/runtime dispatch, array slicing, sorting with custom comparators, and more.
- **Speed up file I/O:** being 45× slower than Zig is, well... not okay.
- **Make error messages friendlier to LLMs:** for example, if the model writes `&&`, tell it to use `and`.
- **Grow the ecosystem:** libraries, editor extensions, and more.

Coverage is especially interesting: mathematically, adding just one more supported task would be enough to put Quidra alongside or slightly above Zig for first place in semantic compression under the current measurements. That is where I want to start.

## Conclusion

I developed a language called Quidra around the goal of **Maximum Meaning Per Token**.

In a benchmark across ten languages, **Quidra ranked 2nd in semantic compression — and 1st in quality Q when coverage is excluded — and 4th in language quality**. On the other hand, LLM prior knowledge and the ecosystem are still immature, and those are areas I want to grow together with everyone from here.

Please give it a try!

- GitHub: https://github.com/quidra-lang/quidra
- Playground (no installation required; type checking and formatting work in the browser, while execution is local): https://quidra-lang.github.io/playground/

**Collaborators are very welcome!** Stars, Issues, and PRs are also appreciated.

Thank you very much for reading to the end!

---

Original Japanese article:
https://qiita.com/koba-jon/items/241b4aefe3fa5bd1e9a7
