# Show Components - JSX Transformation (REWRITTEN)

**Date:** 2026-02-11  
**Status:** ✅ VALID (Rewritten to focus on actual transformer concerns)

---

## ⚠️ CRITICAL CLARIFICATION

**`<Show>` is a RUNTIME COMPONENT from `@synetics/synetics.dev`, NOT a transformer feature.**

The transformer does NOT implement `<Show>` logic. The runtime already provides it.

**See:** `packages/synetics.dev/src/control-flow/show-registry.ts`

---

## 🎯 What This Plan Actually Covers

**Transformer's ONLY responsibility for `<Show>`:**

1. Parse `<Show when={...}>` as normal JSX
2. Transform to `t_element('Show', { when: ... }, [children])`
3. Auto-import `Show` from `@synetics/synetics.dev` if used
4. Preserve reactive expressions in `when` prop
5. **That's it.**

No special transformation needed. `<Show>` is handled like any other JSX component.

---

## ✅ Actual Transformation Requirements

### 1. JSX Parsing (Already Works)

**Input:**

```psr
<Show when={isLoggedIn()}>
  <Dashboard />
</Show>
```

**Output:**

```js
t_element('Show', { when: isLoggedIn() }, [t_element('Dashboard', null, [])]);
```

**Auto-import:**

```js
import { Show } from '@synetics/synetics.dev';
```

### 2. Preserve Reactive Expressions

**Input:**

```psr
<Show when={user.loading()}>
  <LoadingSpinner />
</Show>
```

**Transformer must:**

- ✅ Preserve `user.loading()` call in `when` prop
- ✅ NOT evaluate or transform the reactive expression
- ✅ Let runtime handle reactivity

### 3. Handle Fallback Prop

**Input:**

```psr
<Show
  when={data()}
  fallback={<Loading />}
>
  <Content data={data()} />
</Show>
```

**Output:**

```js
t_element(
  'Show',
  {
    when: data(),
    fallback: t_element('Loading', null, []),
  },
  [t_element('Content', { data: data() }, [])]
);
```

### 4. Nested Show Components

**Input:**

```psr
<Show when={user()}>
  <Show when={user().isAdmin}>
    <AdminPanel />
  </Show>
</Show>
```

**Transformer must:**

- ✅ Parse nested `<Show>` components correctly
- ✅ Transform each to `t_element()` calls
- ✅ Preserve nesting structure

### 5. Complex Expressions in `when`

**Input:**

```psr
<Show when={count() > 0 && isVisible()}>
  <div>{count()}</div>
</Show>
```

**Transformer must:**

- ✅ Parse complex boolean expressions
- ✅ Preserve all reactive calls (`count()`, `isVisible()`)
- ✅ NOT optimize or simplify the expression

---

## ❌ What Transformer Does NOT Do

### 1. Does NOT Implement Conditional Logic

**Runtime handles:**

- ✅ Evaluating `when` condition
- ✅ Rendering children if true
- ✅ Rendering fallback if false
- ✅ Disposing computations when switching

**Transformer:**

- ❌ DOES NOT implement this logic
- ❌ DOES NOT "transform to reactive conditional rendering"
- ❌ DOES NOT wrap in `createMemo()`

### 2. Does NOT Implement Lazy Evaluation

**Runtime handles:**

- ✅ Lazy evaluation of branches
- ✅ Preventing subscriptions in unused branches

**Transformer:**

- ❌ Just transforms JSX to function calls
- ❌ Runtime decides when to evaluate

### 3. Does NOT Handle Cleanup

**Runtime handles:**

- ✅ Cleanup when condition changes
- ✅ Disposal of reactive subscriptions

**Transformer:**

- ❌ No cleanup logic needed
- ❌ Runtime handles lifecycle

---

## 🧪 Test Requirements

### Test 1: Basic Show Component

**Input:**

```psr
const result = <Show when={true}><div>Visible</div></Show>;
```

**Expected Output:**

```js
const result = t_element('Show', { when: true }, [t_element('div', null, ['Visible'])]);
```

### Test 2: Show with Fallback

**Input:**

```psr
<Show when={loaded()} fallback={<Spinner />}>
  <Content />
</Show>
```

**Expected Output:**

```js
t_element(
  'Show',
  {
    when: loaded(),
    fallback: t_element('Spinner', null, []),
  },
  [t_element('Content', null, [])]
);
```

### Test 3: Auto-Import Detection

**Input:**

```psr
component App() {
  return <Show when={true}><div>Hi</div></Show>;
}
```

**Expected:**

- ✅ Auto-import: `import { Show } from '@synetics/synetics.dev';`

### Test 4: Complex Expression Preservation

**Input:**

```psr
<Show when={a() && b() || c()}>
  <Child />
</Show>
```

**Expected:**

- ✅ Preserve entire expression: `when: a() && b() || c()`
- ✅ Do NOT simplify or evaluate

---

## ✅ Validation Checklist

Before marking this plan complete:

- [ ] `<Show>` JSX transforms to `t_element('Show', ...)` (like any JSX)
- [ ] Reactive expressions in `when` prop are preserved
- [ ] `fallback` prop is transformed correctly
- [ ] Auto-import for `Show` works
- [ ] Nested `<Show>` components work
- [ ] Complex boolean expressions in `when` are preserved
- [ ] **Confirmed:** No special transformation logic beyond normal JSX handling

---

## 📖 Related

- Runtime implementation: `packages/synetics.dev/src/control-flow/show-registry.ts`
- Scope definition: `packages/synetics-transformer/docs/PSR-TRANSFORMER-SCOPE.md`
- JSX transformation: `packages/synetics-transformer/src/transformer/prototypes/transform-jsx-element.ts`

---

**Last Updated:** 2026-02-11  
**Status:** ✅ Rewritten to reflect actual transformer scope
