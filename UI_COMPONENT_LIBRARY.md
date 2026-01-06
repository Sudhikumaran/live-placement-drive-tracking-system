# UI Component Library - Quick Reference

## Color System

### Primary Actions

```
Blue-600 (#0284c7)  - Main CTA buttons, links
Blue-700 (#0369a1)  - Hover state
```

### Semantic Colors

```
Success: Green-500 (#10b981)
Warning: Amber-400 (#fbbf24)
Error:   Red-500 (#ef4444)
Info:    Blue-500 (#0ea5e9)
```

### Backgrounds

```
Light Mode:
  Primary:    #ffffff (white)
  Secondary:  #f8fafc (slate-50)
  Tertiary:   #f1f5f9 (slate-100)

Dark Mode:
  Primary:    #0f172a (slate-900)
  Secondary:  #1e293b (slate-800)
  Tertiary:   #334155 (slate-700)
```

### Text Colors

```
Light Mode:
  Primary:    #0f172a (slate-900)
  Secondary:  #475569 (slate-600)
  Tertiary:   #94a3b8 (slate-400)

Dark Mode:
  Primary:    #f8fafc (slate-50)
  Secondary:  #cbd5e1 (slate-300)
  Tertiary:   #94a3b8 (slate-400)
```

## Components

### Buttons

#### Primary Button

```jsx
<button className="btn btn-primary">Action</button>
```

- Blue background
- White text
- Hover: darker blue
- Used for main actions

#### Secondary Button

```jsx
<button className="btn btn-secondary">Action</button>
```

- Light gray background
- Dark text
- Hover: lighter shade
- Used for alternative actions

#### Ghost Button

```jsx
<button className="btn btn-ghost">Action</button>
```

- Transparent background
- Colored text
- Hover: light background
- Used for tertiary actions

### Input Fields

#### Text Input

```jsx
<input type="text" className="input-field" placeholder="Text..." />
```

- Consistent padding: 10px
- Border-radius: 8px
- Blue focus ring
- Works in light and dark modes

#### Select Dropdown

```jsx
<select className="input-field">
  <option>Option 1</option>
</select>
```

- Same styling as text inputs
- Works with all input types

### Cards

#### Basic Card

```jsx
<div className="card p-6">Content here</div>
```

- White background (light) / slate-800 (dark)
- Subtle border
- Soft shadow
- Hover: enhanced shadow
- Smooth transitions

### Badges

#### Status Badge - Success

```jsx
<span className="badge badge-success">Active</span>
```

- Green background
- Green text
- Rounded pill shape

#### Status Badge - Error

```jsx
<span className="badge badge-error">Inactive</span>
```

- Red background
- Red text

#### Status Badge - Warning

```jsx
<span className="badge badge-warning">Pending</span>
```

- Yellow background
- Yellow text

#### Status Badge - Primary

```jsx
<span className="badge badge-primary">Info</span>
```

- Blue background
- Blue text

### Tables

#### Table Header

```jsx
<th className="table-head">Column Name</th>
```

- Slate-100 background (light) / slate-800 (dark)
- Gray text (secondary color)
- Uppercase, bold, small font

#### Table Cell

```jsx
<td className="table-cell">Cell Content</td>
```

- Proper padding
- Subtle border-bottom
- Responsive text size

#### Table Row

```jsx
<tr className="table-row">
  <td className="table-cell">Data</td>
</tr>
```

- Hover: light background
- Smooth transition

### Divider

```jsx
<div className="divider"></div>
```

- Subtle border-top
- Separates sections

### Loading Skeleton

```jsx
<div className="skeleton h-4 w-24 rounded"></div>
```

- Animated shimmer effect
- Used during data loading
- Combine with height/width utilities

## Typography

### Headings

```jsx
<h1 className="text-4xl font-bold">Large Title</h1>
<h2 className="text-3xl font-bold">Section Title</h2>
<h3 className="text-2xl font-semibold">Subsection</h3>
```

### Body Text

```jsx
<p className="text-base text-gray-900 dark:text-white">
  Regular paragraph text
</p>
```

### Small Text

```jsx
<p className="text-sm text-gray-600 dark:text-gray-400">Small secondary text</p>
```

### Emphasis

```jsx
<strong className="font-semibold">Important</strong>
<em className="italic">Emphasized</em>
```

## Spacing Utilities

### Padding

- `p-2` = 8px
- `p-4` = 16px
- `p-6` = 24px
- `p-8` = 32px

### Margin

- `m-2` = 8px
- `m-4` = 16px
- `m-6` = 24px
- `m-8` = 32px

### Gap

- `gap-2` = 8px
- `gap-4` = 16px
- `gap-6` = 24px

## Responsive Design

### Breakpoints

- `sm:` - 640px (tablets)
- `md:` - 768px (medium tablets)
- `lg:` - 1024px (laptops)
- `xl:` - 1280px (desktops)

### Example

```jsx
<div className="hidden md:block">Only visible on medium screens and up</div>
```

## Dark Mode Usage

All components automatically support dark mode:

```jsx
// Automatic dark mode support
<div className="bg-white dark:bg-slate-800">
  Adapts to system theme
</div>

<p className="text-gray-900 dark:text-white">
  Text color changes automatically
</p>
```

## Animations

### Page Load

```jsx
<div className="animate-fade-in-up">Fades in and moves up on load</div>
```

### Scale In

```jsx
<div className="animate-scale-in">Scales up on appear</div>
```

### Loading Spinner

```jsx
<svg className="animate-spin">Rotates continuously</svg>
```

## Icons

### Heroicons Style (Used Throughout)

```jsx
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
</svg>
```

Common sizes:

- `w-4 h-4` = 16px (small)
- `w-5 h-5` = 20px (standard)
- `w-6 h-6` = 24px (large)
- `w-8 h-8` = 32px (extra large)

## Focus States

All interactive elements have visible focus states:

```jsx
/* Buttons and inputs */
className = "focus:outline-none focus:ring-2 focus:ring-blue-500";

/* For dark mode */
className = "dark:focus:ring-blue-400";
```

## Transitions

All transitions use 200ms duration by default:

```jsx
className = "transition-all duration-200";
className = "transition-colors duration-200";
className = "transition-transform duration-200";
```

## Best Practices

1. **Color:** Always use semantic color classes, not raw hex values
2. **Spacing:** Use Tailwind spacing scale (multiples of 4px)
3. **Typography:** Maintain hierarchy with font-size and font-weight
4. **Interaction:** Ensure focus states and hover states are visible
5. **Dark Mode:** Always test with dark mode enabled
6. **Accessibility:** Maintain color contrast ratios (WCAG AA minimum)
7. **Performance:** Avoid unnecessary animations and hover effects
8. **Consistency:** Stick to the component system defined above

## Common Patterns

### Form Group

```jsx
<div>
  <label className="block text-sm font-semibold mb-2">Label</label>
  <input className="input-field" type="text" />
</div>
```

### Card with Header

```jsx
<div className="card overflow-hidden">
  <div className="border-b border-slate-200 dark:border-slate-700 p-6">
    <h3 className="font-semibold">Title</h3>
  </div>
  <div className="p-6">Content</div>
</div>
```

### Status List

```jsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <span>Item</span>
    <span className="badge badge-success">Active</span>
  </div>
</div>
```

---

## Troubleshooting

### Issue: Colors not appearing in dark mode

**Solution:** Ensure `dark:` prefix is used and dark mode class is on parent

### Issue: Input focus ring not visible

**Solution:** Check z-index of overlapping elements

### Issue: Animation stuttering

**Solution:** Verify GPU acceleration with `will-change` or `transform`

### Issue: Spacing looks off

**Solution:** Use Tailwind's spacing scale (4, 8, 12, 16, 24, etc.)

---

_Last Updated: January 2026_
