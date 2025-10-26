# Performance Testing Guide

This guide provides step-by-step instructions for testing the performance of your MakeABet application.

## Quick Performance Check

Run the bundle analysis script to get an overview of your build size:

```bash
pnpm analyze:bundle
```

This will:
1. Build the production bundle
2. Analyze all JavaScript and CSS files
3. Provide size recommendations
4. Highlight any performance issues

## Detailed Performance Testing

### 1. Bundle Size Analysis

#### Check Current Bundle Size

```bash
# Build the production bundle
pnpm --filter @makeabet/web build

# The output will show chunk sizes like:
# dist/assets/index-abc123.js    245.67 kB │ gzip: 78.23 kB
# dist/assets/vendor-def456.js   189.45 kB │ gzip: 62.11 kB
```

#### Target Metrics

- **Total JavaScript**: < 500KB (gzipped)
- **Largest Chunk**: < 200KB (gzipped)
- **Total CSS**: < 50KB (gzipped)
- **Initial Load**: < 3 seconds on 3G

#### Analyze Bundle Composition

For detailed bundle analysis, you can use the rollup-plugin-visualizer:

```bash
# Install the plugin
pnpm --filter @makeabet/web add -D rollup-plugin-visualizer

# Update vite.config.ts to include the plugin
# Then build and it will open a visualization
pnpm --filter @makeabet/web build
```

### 2. Lighthouse Audit

Lighthouse provides comprehensive performance metrics.

#### Run Lighthouse

1. Build the production app:
   ```bash
   pnpm --filter @makeabet/web build
   ```

2. Start the preview server:
   ```bash
   pnpm --filter @makeabet/web preview
   ```

3. Open Chrome and navigate to `http://localhost:4173`

4. Open Chrome DevTools (F12)

5. Go to the "Lighthouse" tab

6. Select:
   - Categories: Performance, Accessibility, Best Practices, SEO
   - Device: Desktop or Mobile
   - Mode: Navigation

7. Click "Analyze page load"

#### Target Scores

- **Performance**: > 90
- **Accessibility**: > 90
- **Best Practices**: > 90
- **SEO**: > 90

#### Key Metrics to Watch

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Total Blocking Time (TBT)**: < 300ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Speed Index**: < 3.0s

### 3. Network Throttling Test

Test how your app performs on slow networks.

#### Using Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to the "Network" tab
3. Click the throttling dropdown (usually says "No throttling")
4. Select "Slow 3G" or "Fast 3G"
5. Reload the page (Cmd+R or Ctrl+R)
6. Observe:
   - Time to first paint
   - Time to interactive
   - Total load time

#### Target Metrics on Slow 3G

- **Initial Load**: < 5 seconds
- **Time to Interactive**: < 7 seconds
- **Total Page Size**: < 2MB

### 4. React Performance Profiling

Use React DevTools to identify slow components.

#### Install React DevTools

1. Install the Chrome extension: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)

#### Profile Your App

1. Open React DevTools
2. Go to the "Profiler" tab
3. Click the record button (⚫)
4. Interact with your app (switch chains, connect wallet, etc.)
5. Click stop (⏹)
6. Review the flame graph to identify slow renders

#### What to Look For

- **Long render times**: Components taking > 16ms to render
- **Frequent re-renders**: Components rendering unnecessarily
- **Large component trees**: Deep nesting causing cascading updates

### 5. Memory Leak Detection

Check for memory leaks that can slow down your app over time.

#### Using Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to the "Memory" tab
3. Take a heap snapshot
4. Interact with your app (switch chains, connect/disconnect wallet)
5. Take another heap snapshot
6. Compare snapshots to see memory growth

#### What to Look For

- **Growing memory**: Memory that doesn't get garbage collected
- **Detached DOM nodes**: Components not properly unmounted
- **Event listeners**: Listeners not cleaned up

### 6. Load Time Testing

Measure actual load times in different scenarios.

#### Test Scenarios

1. **Cold Start** (first visit, no cache):
   ```bash
   # Clear browser cache
   # Open DevTools → Application → Clear storage → Clear site data
   # Reload page and measure load time
   ```

2. **Warm Start** (cached assets):
   ```bash
   # Reload page normally (Cmd+R or Ctrl+R)
   # Measure load time
   ```

3. **Hot Start** (back/forward navigation):
   ```bash
   # Navigate away and back
   # Measure load time
   ```

#### Measuring Load Time

Use the Performance API in the console:

```javascript
// Get navigation timing
const perfData = performance.getEntriesByType('navigation')[0];
console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
console.log('Load Complete:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
console.log('Total Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
```

### 7. Mobile Performance Testing

Test on actual mobile devices for real-world performance.

#### Using Chrome Remote Debugging

1. Connect your Android device via USB
2. Enable USB debugging on your device
3. Open Chrome on desktop
4. Navigate to `chrome://inspect`
5. Select your device
6. Open your app on the device
7. Click "Inspect" to open DevTools

#### Using Safari for iOS

1. Connect your iOS device via USB
2. Enable Web Inspector on your device (Settings → Safari → Advanced)
3. Open Safari on Mac
4. Navigate to Develop → [Your Device]
5. Select your app
6. Use Web Inspector to profile

### 8. Automated Performance Testing

Set up automated performance testing in CI/CD.

#### Using Lighthouse CI

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse CI
lhci autorun --collect.url=http://localhost:4173
```

#### Add to CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: Performance Test
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build
        run: pnpm install && pnpm build
      - name: Run Lighthouse
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

## Performance Optimization Checklist

Use this checklist before deploying:

### Build Optimization
- [ ] Run `pnpm analyze:bundle` and check for large chunks
- [ ] Verify code splitting is working (multiple chunks)
- [ ] Check for duplicate dependencies
- [ ] Remove unused dependencies
- [ ] Optimize images (WebP, compression)

### Runtime Optimization
- [ ] Lazy load non-critical components
- [ ] Use React.memo for expensive components
- [ ] Implement proper loading states
- [ ] Debounce expensive operations
- [ ] Cache API responses appropriately

### Network Optimization
- [ ] Enable gzip/brotli compression
- [ ] Use CDN for static assets
- [ ] Implement proper caching headers
- [ ] Minimize API requests
- [ ] Batch RPC calls when possible

### Testing
- [ ] Run Lighthouse audit (target: 90+ on all metrics)
- [ ] Test on Slow 3G network
- [ ] Test on mobile devices
- [ ] Profile with React DevTools
- [ ] Check for memory leaks

## Common Performance Issues and Solutions

### Issue: Large Initial Bundle

**Symptoms**: Slow initial load, large JavaScript files

**Solutions**:
1. Implement code splitting with dynamic imports
2. Lazy load routes and heavy components
3. Remove unused dependencies
4. Use lighter alternatives for large libraries

**Example**:
```typescript
// Before
import { BettingExperience } from './components/BettingExperience';

// After
const BettingExperience = lazy(() => import('./components/BettingExperience'));
```

### Issue: Slow Re-renders

**Symptoms**: UI feels sluggish, interactions are delayed

**Solutions**:
1. Use React.memo for components that re-render frequently
2. Use useMemo for expensive calculations
3. Use useCallback for event handlers
4. Avoid creating new objects/arrays in render

**Example**:
```typescript
// Before
function MyComponent({ data }) {
  const processed = expensiveOperation(data);
  return <div>{processed}</div>;
}

// After
const MyComponent = memo(function MyComponent({ data }) {
  const processed = useMemo(() => expensiveOperation(data), [data]);
  return <div>{processed}</div>;
});
```

### Issue: Slow Network Requests

**Symptoms**: Long wait times for data, poor UX on slow networks

**Solutions**:
1. Implement proper loading states
2. Use optimistic updates
3. Cache responses with TanStack Query
4. Batch multiple requests
5. Use pagination for large datasets

**Example**:
```typescript
// Use TanStack Query with proper caching
const { data, isLoading } = useQuery({
  queryKey: ['markets'],
  queryFn: fetchMarkets,
  staleTime: 30000, // Cache for 30 seconds
  cacheTime: 300000, // Keep in cache for 5 minutes
});
```

### Issue: Memory Leaks

**Symptoms**: App gets slower over time, high memory usage

**Solutions**:
1. Clean up event listeners in useEffect
2. Cancel pending requests on unmount
3. Clear intervals/timeouts
4. Unsubscribe from observables

**Example**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Do something
  }, 1000);

  // Cleanup
  return () => clearInterval(interval);
}, []);
```

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)

## Getting Help

If you're experiencing performance issues:

1. Run the bundle analysis: `pnpm analyze:bundle`
2. Run Lighthouse audit
3. Check the PERFORMANCE.md guide for optimization tips
4. Profile with React DevTools to identify slow components
5. Test on slow networks to identify bottlenecks
