# For Iteration - JSX Transformation (REWRITTEN)

**Date:** 2026-02-11  
**Status:** ✅ VALID (Rewritten to focus on actual transformer concerns)

---

## ⚠️ CRITICAL CLARIFICATION

**`<For>` is a RUNTIME COMPONENT from `@synetics/synetics.dev`, NOT a transformer feature.**

The transformer does NOT implement `<For>` iteration logic. The runtime already provides it.

**See:** `packages/synetics.dev/src/control-flow/for-registry.ts`

---

## 🎯 What This Plan Actually Covers

**Transformer's ONLY responsibility for `<For>`:**

1. Parse `<For each={...}>` as normal JSX
2. Transform to `t_element('For', { each: ..., children: ... }, [])`
3. Auto-import `For` from `@synetics/synetics.dev` if used
4. Preserve reactive expressions in `each` prop
5. Handle the `children` render callback correctly
6. **That's it.**

No special transformation needed. `<For>` is handled like any other JSX component.

---

## ✅ Actual Transformation Requirements

### 1. Basic For Loop

**Input:**

```psr
<For each={items()}>
  {(item, index) => <div>{item.name}</div>}
</For>
```

**Output:**

```js
t_element(
  'For',
  {
    each: items(),
    children: (item, index) => t_element('div', null, [item.name]),
  },
  []
);
```

**Auto-import:**

```js
import { For } from '@synetics/synetics.dev';
```

### 2. Preserve Reactive Expressions

**Input:**

```psr
<For each={filteredItems()}>
  {(item) => <Card data={item} />}
</For>
```

**Transformer must:**

- ✅ Preserve `filteredItems()` call in `each` prop
- ✅ NOT evaluate or transform the reactive expression
- ✅ Let runtime handle reactivity

### 3. Render Callback Transformation

**Input:**

```psr
<For each={todos()}>
  {(todo, index) => (
    <div>
      <span>{index() + 1}</span>
      <p>{todo.text}</p>
    </div>
  )}
</For>
```

**Output:**

```js
t_element(
  'For',
  {
    each: todos(),
    children: (todo, index) =>
      t_element('div', null, [
        t_element('span', null, [index() + 1]),
        t_element('p', null, [todo.text]),
      ]),
  },
  []
);
```

**Transformer must:**

- ✅ Transform the arrow function body (JSX inside callback)
- ✅ Preserve callback parameters: `(todo, index)`
- ✅ Transform nested JSX to `t_element()` calls

### 4. Fallback Support

**Input:**

```psr
<For each={items()} fallback={<Empty />}>
  {(item) => <Item data={item} />}
</For>
```

**Output:**

```js
t_element(
  'For',
  {
    each: items(),
    children: (item) => t_element('Item', { data: item }, []),
    fallback: t_element('Empty', null, []),
  },
  []
);
```

### 5. Nested For Loops

**Input:**

```psr
<For each={categories()}>
  {(category) => (
    <div>
      <h2>{category.name}</h2>
      <For each={category.items}>
        {(item) => <p>{item}</p>}
      </For>
    </div>
  )}
</For>
```

**Transformer must:**

- ✅ Parse nested `<For>` components correctly
- ✅ Transform each to `t_element()` calls
- ✅ Preserve nesting structure
- ✅ Transform JSX inside nested callbacks

---

## ❌ What Transformer Does NOT Do

### 1. Does NOT Implement Iteration Logic

**Runtime handles:**

- ✅ Iterating over `each` array
- ✅ Calling render callback for each item
- ✅ Tracking array changes (additions, removals, reordering)
- ✅ Fine-grained reactivity (updating only changed items)

**Transformer:**

- ❌ DOES NOT implement iteration
- ❌ DOES NOT track array changes
- ❌ Just transforms JSX to function calls

### 2. Does NOT Implement Keying

**Runtime handles:**

- ✅ Keying items for efficient updates
- ✅ Reconciliation when array changes

**Transformer:**

- ❌ No keying logic
- ❌ Runtime decides how to track items

### 3. Does NOT Handle Cleanup

**Runtime handles:**

- ✅ Cleanup when items are removed
- ✅ Disposal of reactive subscriptions for removed items

**Transformer:**

- ❌ No cleanup logic
- ❌ Runtime handles lifecycle

---

## 🧪 Test Requirements

### Test 1: Basic For Loop

**Input:**

```psr
<For each={[1, 2, 3]}>
  {(n) => <div>{n}</div>}
</For>
```

**Expected Output:**

```js
t_element(
  'For',
  {
    each: [1, 2, 3],
    children: (n) => t_element('div', null, [n]),
  },
  []
);
```

### Test 2: For with Index

**Input:**

```psr
<For each={items()}>
  {(item, i) => <div>{i()}: {item.name}</div>}
</For>
```

**Expected Output:**

```js
t_element(
  'For',
  {
    each: items(),
    children: (item, i) => t_element('div', null, [i(), ': ', item.name]),
  },
  []
);
```

### Test 3: For with Fallback

**Input:**

```psr
<For each={items()} fallback={<div>No items</div>}>
  {(item) => <span>{item}</span>}
</For>
```

**Expected Output:**

```js
t_element(
  'For',
  {
    each: items(),
    children: (item) => t_element('span', null, [item]),
    fallback: t_element('div', null, ['No items']),
  },
  []
);
```

### Test 4: Auto-Import Detection

**Input:**

```psr
component List() {
  return <For each={data()}>{(d) => <div>{d}</div>}</For>;
}
```

**Expected:**

- ✅ Auto-import: `import { For } from '@synetics/synetics.dev';`

### Test 5: Nested JSX in Callback

**Input:**

```psr
<For each={users()}>
  {(user) => (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )}
</For>
```

**Expected:**

- ✅ Transform nested JSX inside callback to `t_element()` calls
- ✅ Preserve callback structure

---

## ✅ Validation Checklist

Before marking this plan complete:

- [ ] `<For>` JSX transforms to `t_element('For', ...)` (like any JSX)
- [ ] Reactive expressions in `each` prop are preserved
- [ ] Render callback is preserved correctly
- [ ] JSX inside callback body is transformed to `t_element()` calls
- [ ] `fallback` prop is transformed correctly
- [ ] Auto-import for `For` works
- [ ] Nested `<For>` components work
- [ ] `index` parameter (if used) is preserved
- [ ] **Confirmed:** No special transformation logic beyond normal JSX handling

---

## 📖 Related

- Runtime implementation: `packages/synetics.dev/src/control-flow/for-registry.ts`
- Scope definition: `packages/synetics-transformer/docs/PSR-TRANSFORMER-SCOPE.md`
- JSX transformation: `packages/synetics-transformer/src/transformer/prototypes/transform-jsx-element.ts`

---

**Last Updated:** 2026-02-11  
**Status:** ✅ Rewritten to reflect actual transformer scope
