# Performance Optimization Guide

This document outlines the performance optimizations implemented in the MakeABet scaffold and provides guidance for maintaining optimal performance.

## Bundle Size Optimizations

### 1. Code Splitting

The application uses strategic code splitting to reduce initial bundle size:

- **Lazy Loading**: Heavy components like `BettingExperience` are lazy-loaded using React's `lazy()` and `Suspense`
- **Manual Chunks**: Vite is configured to split vendor libraries into separate chunks for better caching:
  - `react-vendor`: React core libraries
  - `wallet-evm`: EVM wallet libraries (wagmi, viem, RainbowKit)
  - `wallet-solana`: Solana wallet libraries
  - `ui-vendor`: Mantine UI components
  - `query-vendor`: TanStack Query and Router

### 2. Build Configuration

The Vite build is optimized with:

```typescript
{
  build: {
    sourcemap: false,           // Disable source maps for smaller builds
    minify: 'esbuild',          // Fast minification
    target: 'es2020',           // Modern browsers only
    chunkSizeWarningLimit: 1000 // Reasonable chunk size limit
  }
}
```

### 3. Dependency Optimization

Pre-bundled dependencies for faster dev server startup:

```typescript
{
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mantine/core',
      '@mantine/notifications',
      '@tanstack/react-query',
    ],
    exclude: ['@solana/wallet-adapter-react-ui'],
  }
}
```

## Performance Metrics

### Target Metrics

- **Initial Load Time**: < 3 seconds on 3G
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Time to Interactive (TTI)**: < 3.5 seconds
- **Total Bundle Size**: < 500KB (gzipped)
- **Largest Chunk**: < 200KB (gzipped)

### Measuring Performance

#### 1. Build Analysis

Check bundle size after building:

```bash
pnpm --filter @makeabet/web build
```

The build output will show chunk sizes. Look for:
- Total bundle size
- Individual chunk sizes
- Any warnings about large chunks

#### 2. Bundle Visualization

To visualize the bundle composition, add the rollup-plugin-visualizer:

```bash
pnpm --filter @makeabet/web add -D rollup-plugin-visualizer
```

Then update `vite.config.ts`:

```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

#### 3. Lighthouse Audit

Run Lighthouse in Chrome DevTools:

1. Build the production app: `pnpm --filter @makeabet/web build`
2. Preview the build: `pnpm --filter @makeabet/web preview`
3. Open Chrome DevTools → Lighthouse
4. Run audit for Performance, Accessibility, Best Practices, SEO

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

#### 4. Network Throttling

Test on slow networks:

1. Open Chrome DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Reload the page
4. Measure load time and interactivity

## Asset Optimization

### Images

Currently, the scaffold has minimal images. When adding images:

1. **Use WebP format** for better compression
2. **Optimize images** before adding:
   ```bash
   # Using imagemagick
   convert input.png -quality 85 output.webp
   ```
3. **Use responsive images** with `srcset`
4. **Lazy load images** below the fold

### Fonts

If adding custom fonts:

1. **Use system fonts** when possible
2. **Subset fonts** to include only needed characters
3. **Use `font-display: swap`** to prevent FOIT (Flash of Invisible Text)
4. **Preload critical fonts**:
   ```html
   <link rel="preload" href="/fonts/font.woff2" as="font" type="font/woff2" crossorigin>
   ```

### Icons

The scaffold uses `@tabler/icons-react`:

1. **Import only needed icons** (tree-shaking enabled)
2. **Consider icon sprites** for many icons
3. **Use SVG icons** instead of icon fonts

## Runtime Performance

### 1. React Optimization

- **Memoization**: Use `useMemo` and `useCallback` for expensive computations
- **Component Memoization**: Use `React.memo` for components that re-render frequently
- **Avoid inline functions**: Define callbacks outside render when possible
- **Key props**: Always use stable keys in lists

### 2. State Management

- **TanStack Query**: Configured with appropriate cache times
- **Local Storage**: Used sparingly for chain selection and tab state
- **Avoid prop drilling**: Use context for deeply nested props

### 3. Network Requests

- **Query caching**: TanStack Query caches API responses
- **Debouncing**: Balance queries are debounced
- **Request deduplication**: Multiple identical requests are deduplicated
- **Error retry**: Failed requests retry with exponential backoff

### 4. Wallet Connections

- **Lazy initialization**: Wallet adapters are only initialized when needed
- **Connection pooling**: RPC connections are reused
- **Batch requests**: Multiple RPC calls are batched when possible

## Monitoring Performance

### Development

Monitor performance during development:

```bash
# Check bundle size
pnpm --filter @makeabet/web build

# Run with performance profiling
pnpm --filter @makeabet/web dev
```

Use React DevTools Profiler to identify slow components.

### Production

For production monitoring, consider:

1. **Web Vitals**: Track Core Web Vitals (LCP, FID, CLS)
2. **Error Tracking**: Use Sentry or similar for error monitoring
3. **Analytics**: Track page load times and user interactions
4. **RUM (Real User Monitoring)**: Monitor actual user experience

## Optimization Checklist

### Before Deployment

- [ ] Run production build and check bundle sizes
- [ ] Run Lighthouse audit (target: 90+ on all metrics)
- [ ] Test on slow 3G network
- [ ] Test on mobile devices
- [ ] Verify lazy loading works correctly
- [ ] Check for console errors/warnings
- [ ] Verify all images are optimized
- [ ] Test with React DevTools Profiler

### Regular Maintenance

- [ ] Review bundle size after adding dependencies
- [ ] Update dependencies regularly (security + performance)
- [ ] Monitor production performance metrics
- [ ] Review and optimize slow API endpoints
- [ ] Audit unused dependencies
- [ ] Check for memory leaks

## Common Performance Issues

### Large Bundle Size

**Symptoms**: Initial load is slow, large JavaScript files

**Solutions**:
1. Check for duplicate dependencies: `pnpm list --depth=0`
2. Analyze bundle with visualizer
3. Remove unused dependencies
4. Use dynamic imports for large libraries
5. Consider lighter alternatives (e.g., date-fns instead of moment)

### Slow Initial Render

**Symptoms**: White screen for several seconds

**Solutions**:
1. Add loading skeleton/spinner
2. Lazy load non-critical components
3. Reduce initial data fetching
4. Use SSR/SSG if needed (consider Next.js)

### Slow Re-renders

**Symptoms**: UI feels sluggish, interactions are delayed

**Solutions**:
1. Use React DevTools Profiler to identify slow components
2. Add `React.memo` to expensive components
3. Use `useMemo` for expensive calculations
4. Avoid creating new objects/arrays in render
5. Optimize list rendering with proper keys

### Memory Leaks

**Symptoms**: Page gets slower over time, high memory usage

**Solutions**:
1. Clean up event listeners in `useEffect` cleanup
2. Cancel pending requests on unmount
3. Clear intervals/timeouts
4. Unsubscribe from observables
5. Use Chrome DevTools Memory Profiler

## Best Practices

1. **Measure First**: Always measure before optimizing
2. **Optimize Critical Path**: Focus on initial load and interactivity
3. **Progressive Enhancement**: Start with core functionality, add features progressively
4. **Test on Real Devices**: Emulators don't reflect real performance
5. **Monitor Production**: Track real user metrics
6. **Document Changes**: Keep this guide updated with new optimizations

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## Performance Budget

Set and enforce performance budgets:

```json
{
  "budgets": [
    {
      "path": "dist/assets/*.js",
      "maxSize": "200kb",
      "type": "initial"
    },
    {
      "path": "dist/assets/*.css",
      "maxSize": "50kb",
      "type": "initial"
    }
  ]
}
```

Consider adding budget enforcement to CI/CD pipeline.
