# Express 5 Migration Guide

## Issue: Read-only req.query Property

### Problem
In Express 5, the `req.query` property has become read-only. This causes the error:
```
Cannot set property query of #<IncomingMessage> which has only a getter
```

This error occurs when middleware attempts to modify `req.query` directly, which was common in Express 4 for validation and transformation purposes.

### Solution Implemented

1. **Modified Validation Middleware** (`src/middlewares/validation.middleware.ts`):
   - Instead of directly assigning to `req.query`, validated query parameters are now stored in `req.validatedQuery`
   - Added a helper function `getValidatedQuery()` to retrieve query parameters

2. **Updated Type Definitions** (`src/types/express.d.ts`):
   - Added `validatedQuery?: any` to the Express Request interface

3. **Updated Controllers**:
   - All controllers now use `getValidatedQuery(req)` instead of accessing `req.query` directly
   - This ensures they get the validated/transformed query parameters when validation is applied

### Code Changes

#### Before (Express 4 compatible):
```typescript
// In validation middleware
req[target] = value; // This fails when target is 'query' in Express 5

// In controllers
const { page, limit } = req.query;
```

#### After (Express 5 compatible):
```typescript
// In validation middleware
if (target === ValidationTarget.QUERY) {
  (req as any).validatedQuery = value;
} else {
  req[target] = value;
}

// In controllers
import { getValidatedQuery } from '../middlewares/validation.middleware';
const { page, limit } = getValidatedQuery(req);
```

### Testing the Fix

Run the test script to verify the fix:
```bash
node test-express5-fix.js
```

Then test with:
```bash
curl "http://localhost:3333/test?foo=bar"
```

### Affected Files
- `src/middlewares/validation.middleware.ts` - Core fix implementation
- `src/types/express.d.ts` - Type definitions
- `src/controllers/user.controller.ts` - Updated to use getValidatedQuery
- `src/controllers/role.controller.ts` - Updated to use getValidatedQuery
- `src/controllers/menu.controller.ts` - Updated to use getValidatedQuery
- `src/controllers/permission.controller.ts` - Updated to use getValidatedQuery
- `src/controllers/resource.controller.ts` - Updated to use getValidatedQuery

### Benefits
- Full Express 5 compatibility
- Backward compatible with Express 4
- Type-safe implementation
- Minimal code changes required
- Clear separation between original and validated query parameters