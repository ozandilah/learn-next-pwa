# 🗄️ **Supabase + Prisma + TanStack Query Architecture**

## **Overview**

Arsitektur offline-first PWA dengan real database dan state management modern:

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         React Components (UI)                          │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   ↓                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      TanStack Query (State Management)                 │ │
│  │  • Query Cache (in-memory)                             │ │
│  │  • Optimistic Updates                                  │ │
│  │  • Automatic Refetching                                │ │
│  │  • Offline-First Mode                                  │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   ↓                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         IndexedDB (Fallback Storage)                   │ │
│  │  • Persistent offline data                             │ │
│  │  • Sync queue when offline                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS API Calls
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                 SERVER (Next.js API Routes)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Routes (/api/todos)                   │ │
│  │  • GET /api/todos - List all                           │ │
│  │  • POST /api/todos - Create                            │ │
│  │  • PUT /api/todos/:id - Update                         │ │
│  │  • DELETE /api/todos/:id - Delete                      │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   ↓                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Prisma ORM (Type-safe)                      │ │
│  │  • Schema validation                                   │ │
│  │  • Query builder                                       │ │
│  │  • Migration management                                │ │
│  └────────────────┬───────────────────────────────────────┘ │
└────────────────────┼───────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           DATABASE (Supabase PostgreSQL)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Table: todos                                          │ │
│  │  ├─ id (String, CUID)                                  │ │
│  │  ├─ title (String)                                     │ │
│  │  ├─ completed (Boolean)                                │ │
│  │  ├─ userId (String, Optional)                          │ │
│  │  ├─ createdAt (DateTime)                               │ │
│  │  └─ updatedAt (DateTime)                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Features:                                                   │
│  • Connection Pooling (PgBouncer)                            │
│  • Real-time subscriptions                                   │
│  • Row Level Security                                        │
│  • Automatic backups                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## **Why This Stack is Scalable**

### **1. TanStack Query Benefits**
```typescript
✅ Automatic caching
✅ Background refetching
✅ Optimistic updates (instant UI)
✅ Request deduplication
✅ Pagination & infinite queries
✅ Parallel queries
✅ Dependent queries
✅ Window focus refetching
✅ Offline support built-in
```

### **2. Supabase + Prisma Benefits**
```typescript
✅ Connection pooling (handles 1000s of connections)
✅ Type-safe queries (no SQL injection)
✅ Schema migrations (version control for DB)
✅ Auto-generated types
✅ Real-time subscriptions
✅ Row-level security
✅ Geographic regions (low latency)
✅ Automatic backups
```

### **3. Offline-First Benefits**
```typescript
✅ Works without internet
✅ Instant UI updates (optimistic)
✅ Automatic sync when online
✅ Resilient to network failures
✅ Better UX on slow networks
```

---

## **Setup Instructions**

### **Step 1: Install Dependencies**
```bash
npm install prisma @prisma/client @tanstack/react-query @tanstack/react-query-devtools
```

### **Step 2: Setup Prisma**
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Open Prisma Studio (GUI)
npx prisma studio
```

### **Step 3: Environment Variables**
Create `.env.local`:
```env
# Supabase URLs
DATABASE_URL="postgresql://postgres.xhmrdushbsskdgyhjrzg:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xhmrdushbsskdgyhjrzg:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

---

## **Architecture Flow**

### **Create Todo (Online)**
```
1. User clicks "Add Todo"
2. TanStack Query → Optimistic update (instant UI)
3. API call → POST /api/todos
4. Prisma → INSERT into database
5. Supabase → Saves to PostgreSQL
6. Response → Update cache with real data
7. UI reflects actual server data
```

### **Create Todo (Offline)**
```
1. User clicks "Add Todo"
2. TanStack Query → Optimistic update (instant UI)
3. API call FAILS (offline)
4. Cache keeps optimistic data
5. When online → Auto retry
6. Success → Cache updates with real data
```

### **Update Todo**
```
1. User toggles checkbox
2. Optimistic update → UI changes instantly
3. Background API call → PUT /api/todos/:id
4. Prisma → UPDATE database
5. Success → Invalidate & refetch cache
```

---

## **Performance Optimizations**

### **1. Connection Pooling**
```typescript
// Supabase PgBouncer handles 1000s of concurrent connections
DATABASE_URL="...pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### **2. Query Caching**
```typescript
// TanStack Query caches for 30 seconds
staleTime: 30 * 1000
```

### **3. Request Deduplication**
```typescript
// Multiple components use same query → 1 network request
const { data } = useTodos() // Shared cache
```

### **4. Optimistic Updates**
```typescript
// UI updates before server responds
onMutate: (newTodo) => {
  queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
}
```

---

## **Scalability Checklist**

✅ **Database:**
- Connection pooling (handles high traffic)
- Indexed queries (fast lookups)
- Migration system (version control)

✅ **State Management:**
- Centralized cache
- Automatic garbage collection
- Memory efficient

✅ **Offline Support:**
- IndexedDB for large datasets
- Background sync
- Conflict resolution

✅ **API Design:**
- RESTful endpoints
- Proper error handling
- Rate limiting ready

✅ **Type Safety:**
- End-to-end types (DB → API → UI)
- Compile-time error catching
- Auto-completion

---

## **Production Considerations**

### **Authentication**
```typescript
// Add userId to todos
model Todo {
  userId String? // Link to auth user
}
```

### **Pagination**
```typescript
// Use TanStack Query infinite queries
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['todos'],
  queryFn: ({ pageParam = 0 }) => fetchTodos(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
```

### **Real-time Updates**
```typescript
// Supabase Realtime for live updates
supabase
  .channel('todos')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, 
    (payload) => {
      queryClient.invalidateQueries(['todos'])
    }
  )
  .subscribe()
```

### **Error Handling**
```typescript
// Retry failed requests
retry: 3,
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
```

---

## **Testing Offline Functionality**

### **Chrome DevTools**
1. Open DevTools (F12)
2. Network tab → Throttling → Offline
3. Try creating/updating todos
4. See optimistic updates working
5. Go back online → Auto sync

### **Expected Behavior**
```
❌ Offline → Create Todo
✅ UI updates instantly (optimistic)
✅ Shows "Syncing..." badge
✅ Data stored in TanStack Query cache

✅ Back Online
✅ Automatic retry
✅ Server receives data
✅ UI updates with real server data
```

---

## **File Structure**
```
src/
├── app/
│   ├── api/
│   │   └── todos/
│   │       ├── route.ts              # GET, POST
│   │       └── [id]/
│   │           └── route.ts          # GET, PUT, DELETE
│   ├── components/
│   │   └── TanstackTodoList.tsx      # Main component
│   └── layout.tsx                     # TanStack Query Provider
├── hooks/
│   └── useTodos.ts                    # Custom hooks
├── lib/
│   ├── prisma.ts                      # Prisma Client
│   └── offline-storage.ts             # IndexedDB fallback
└── providers/
    └── tanstack-query-provider.tsx    # Query Provider
prisma/
└── schema.prisma                      # Database schema
```

---

## **Next Steps**

1. ✅ Run `npx prisma db push` to create tables
2. ✅ Run `npx prisma studio` to view data
3. ✅ Test offline functionality
4. ✅ Add authentication (Supabase Auth)
5. ✅ Add real-time subscriptions
6. ✅ Deploy to Vercel
7. ✅ Monitor with TanStack Query DevTools

---

🎉 **Congratulations!** You now have a production-ready, scalable PWA with:
- Real database (Supabase PostgreSQL)
- Type-safe ORM (Prisma)
- Modern state management (TanStack Query)
- Offline-first architecture
- Optimistic updates
- Automatic sync
