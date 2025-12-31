# Known Issues - Checkpoint 3

## Minor Issue: Hydration Mismatch Warnings

### Symptom
Console shows: "There was an error while hydrating"

### Impact
Visual glitches on initial page load, but doesn't break functionality

### Likely Cause
Server-rendered dates don't match client dates

### Fix Priority
Low - cosmetic issue only

---

## Build Issue: NextAuth Type Compatibility

### Symptom
TypeScript build fails with auth.config.ts type errors

### Status
Development mode works fine. Production build needs type casting fix or NextAuth downgrade.

### Temporary Fix
Development works perfectly with `npm run dev`
