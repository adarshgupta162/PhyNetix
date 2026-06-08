# KaTeX / LaTeX Quick Reference for Question Editors

Use these rules when writing math in question text, options, or solutions.
Wrap inline math with `$...$` and display math with `$$...$$`.

---

## Basic Formatting

| Syntax | Output |
|--------|--------|
| `$x^2$` | x² |
| `$x_i$` | xᵢ |
| `$x^{n+1}$` | x^(n+1) |
| `$\sqrt{x}$` | √x |
| `$\sqrt[3]{x}$` | ∛x |
| `$\frac{a}{b}$` | a/b (fraction) |
| `$\dfrac{a}{b}$` | a/b (display fraction) |

## Greek Letters

| Syntax | Letter |
|--------|--------|
| `$\alpha$` | α |
| `$\beta$` | β |
| `$\gamma$` | γ |
| `$\delta$` | δ |
| `$\theta$` | θ |
| `$\lambda$` | λ |
| `$\mu$` | μ |
| `$\pi$` | π |
| `$\sigma$` | σ |
| `$\omega$` | ω |
| `$\phi$` | φ |
| `$\Delta$` | Δ |
| `$\Omega$` | Ω |

## Operators & Relations

| Syntax | Symbol |
|--------|--------|
| `$\times$` | × |
| `$\div$` | ÷ |
| `$\pm$` | ± |
| `$\leq$` | ≤ |
| `$\geq$` | ≥ |
| `$\neq$` | ≠ |
| `$\approx$` | ≈ |
| `$\equiv$` | ≡ |
| `$\propto$` | ∝ |
| `$\infty$` | ∞ |
| `$\rightarrow$` | → |
| `$\Rightarrow$` | ⇒ |
| `$\leftrightarrow$` | ↔ |

## Calculus & Limits

```
$\lim_{x \to 0} f(x)$
$\int_a^b f(x)\,dx$
$\oint \vec{F} \cdot d\vec{r}$
$\frac{dy}{dx}$
$\frac{\partial f}{\partial x}$
$\sum_{i=1}^{n} a_i$
$\prod_{i=1}^{n} x_i$
```

## Trigonometry

```
$\sin\theta$
$\cos\theta$
$\tan\theta$
$\sin^{-1}x$  or  $\arcsin x$
$\cot\theta$
$\sec\theta$
$\csc\theta$
```

## Vectors & Matrices

```
$\vec{A}$
$\hat{i}$
$\overrightarrow{AB}$
$|\vec{A}|$  or  $\|\vec{A}\|$

$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$$

$$\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$$

$$\begin{vmatrix} a & b \\ c & d \end{vmatrix}$$
```

## Brackets & Grouping

```
$\left( \frac{a}{b} \right)$
$\left[ x^2 + y^2 \right]$
$\left\{ a, b, c \right\}$
$\left| x \right|$
$\left\lfloor x \right\rfloor$
$\left\lceil x \right\rceil$
```

## Chemistry (useful for JEE)

```
$\ce{H2O}$          — not supported, use: $\text{H}_2\text{O}$
$\text{Fe}^{3+}$
$\text{SO}_4^{2-}$
$\rightleftharpoons$ — equilibrium arrow
$\xrightarrow{\Delta}$ — reaction with heat
```

## Common Physics Expressions

```
$F = ma$
$E = mc^2$
$v = u + at$
$s = ut + \frac{1}{2}at^2$
$\vec{F} = q(\vec{E} + \vec{v} \times \vec{B})$
$\nabla \cdot \vec{E} = \frac{\rho}{\epsilon_0}$
```

## Common Math Expressions

```
$ax^2 + bx + c = 0$
$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
$\binom{n}{r} = \frac{n!}{r!(n-r)!}$
$\log_a b$
$\ln x$
$e^{i\pi} + 1 = 0$
```

## Text & Spacing

```
$\text{constant}$    — regular text inside math
$a\,b$               — thin space
$a\;b$               — medium space
$a\quad b$           — large space
$a\qquad b$          — extra large space
$\textbf{bold}$
$\textit{italic}$
```

## Cases / Piecewise Functions

```
$$f(x) = \begin{cases}
  x^2 & \text{if } x \geq 0 \\
  -x & \text{if } x < 0
\end{cases}$$
```

## Aligned Equations

```
$$\begin{aligned}
  2x + 3y &= 7 \\
  x - y &= 1
\end{aligned}$$
```

## Decorations

```
$\overline{AB}$      — line over
$\underline{x}$      — line under
$\hat{x}$            — hat
$\bar{x}$            — bar
$\dot{x}$            — single dot (time derivative)
$\ddot{x}$           — double dot
$\tilde{x}$          — tilde
$\cancel{x}$         — strikethrough (may not work in all KaTeX versions)
```

## Boxed Answers

```
$\boxed{x = 5}$
```

---

## Tips

1. **Inline vs Display**: Use `$...$` for inline math within a sentence. Use `$$...$$` for centered, standalone equations.
2. **Escaping**: Use `\\` for line breaks inside aligned environments, NOT in normal text.
3. **Braces**: Always wrap multi-character superscripts/subscripts in `{}`: `x^{10}` not `x^10`.
4. **Images + LaTeX**: You can mix LaTeX text with uploaded images. The text renders first, images appear below.
5. **Test rendering**: Preview your question after writing to ensure LaTeX renders correctly.
