# Known Issues - Checkpoint 3

## Critical Bug: Completion Tracking Not Updating UI

### Symptom
- Clicking "Complete" button shows success toast
- Mutation appears to succeed (no errors in mutation callbacks)
- **BUT**: UI does not update to show habit as completed
- Completion counter remains at 0/X even after multiple completions
- Page refresh doesn't fix the issue
- Completed habits don't show ✓ Done badge or strikethrough

### What's Working
- ✅ Habit CRUD operations (create, edit, delete)
- ✅ Total Habits counter on dashboard
- ✅ Toast notifications
- ✅ getAllCompletions API endpoint
- ✅ markComplete mutation (data appears to be saved)

### Investigation Findings
1. **API Response**: The `getAllCompletions` query executes successfully
2. **Cache Invalidation**: Both `getAll` and `getAllCompletions` are being invalidated after mutation
3. **Potential Issues**:
   - Date comparison logic in `todayCompletions` useMemo hook
   - Timezone handling between client/server
   - React key collisions (console warns: "two children with same key")
   - Date storage format in database vs query format

### Next Steps to Fix
1. Add debug logging to see what data `getAllCompletions` returns
2. Verify date format being saved to database matches query format
3. Check if completionDate is being stored as Date object or string
4. Consider using UTC dates throughout to avoid timezone issues
5. Fix React key warnings by ensuring unique keys

### Workaround
None currently - completion tracking is non-functional in UI

### Files Involved
- `/src/components/habits/TodayHabits.tsx` - Line 56-71 (todayCompletions calculation)
- `/src/server/api/routers/habit.ts` - getAllCompletions endpoint
- Prisma schema - HabitCompletion model date handling

---

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
