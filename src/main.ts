import { createApp } from "vue";
import { createHead } from "@unhead/vue/client";
import App from "./App.vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { listen } from "@tauri-apps/api/event";

import { i18n } from "./i18n/index";
import "./css/global.css";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("./pages/Home.vue"),
    meta: { preload: true }
  },
  {
    path: "/about",
    name: "About",
    component: () => import("./pages/About.vue")
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("./pages/Settings.vue")
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

// Preload critical routes for better performance
const preloadRoutes = () => {
  // Preload Home route (most commonly used)
  import("./pages/Home.vue");

  // Preload other routes on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import("./pages/Settings.vue");
      import("./pages/About.vue");
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      import("./pages/Settings.vue");
      import("./pages/About.vue");
    }, 100);
  }
};

listen<string>("change_router", (event) => {
  console.log(event.payload);
  router.push({ path: event.payload });
});

const head = createHead();
const app = createApp(App);
app.use(router);
app.use(head);
app.use(i18n);

// Start preloading routes after app setup
preloadRoutes();

// Performance monitoring and metrics
const performanceMetrics = {
  appStartTime: performance.now(),
  mountTime: 0,
  firstPaint: 0,
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  firstInputDelay: 0,
  cumulativeLayoutShift: 0,
};

if (import.meta.env.DEV) {
  console.log('🚀 Rsoul starting...');

  // Monitor navigation timing
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('📊 Navigation Timing:', {
      'DNS Lookup': (navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2) + 'ms',
      'TCP Connect': (navigation.connectEnd - navigation.connectStart).toFixed(2) + 'ms',
      'Server Response': (navigation.responseEnd - navigation.requestStart).toFixed(2) + 'ms',
      'Page Load': (navigation.loadEventEnd - (navigation as any).navigationStart).toFixed(2) + 'ms',
    });
  });

  // Monitor paint timing
  if ('PerformanceObserver' in window) {
    // First Paint
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-paint') {
          performanceMetrics.firstPaint = entry.startTime;
          console.log(`🎨 First Paint: ${entry.startTime.toFixed(2)}ms`);
        } else if (entry.name === 'first-contentful-paint') {
          performanceMetrics.firstContentfulPaint = entry.startTime;
          console.log(`📝 First Contentful Paint: ${entry.startTime.toFixed(2)}ms`);
        }
      }
    });
    paintObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      performanceMetrics.largestContentfulPaint = lastEntry.startTime;
      console.log(`🖼️ Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        performanceMetrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
        console.log(`👆 First Input Delay: ${performanceMetrics.firstInputDelay.toFixed(2)}ms`);
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      performanceMetrics.cumulativeLayoutShift = clsValue;
      console.log(`📐 Cumulative Layout Shift: ${clsValue.toFixed(4)}`);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  app.mount("#app");
  performanceMetrics.mountTime = performance.now() - performanceMetrics.appStartTime;

  // Log comprehensive load metrics
  setTimeout(() => {
    const totalLoadTime = performance.now() - performanceMetrics.appStartTime;
    console.log(`✅ Rsoul loaded in ${totalLoadTime.toFixed(2)}ms`);
    console.log('📈 Performance Summary:', {
      'App Mount Time': `${performanceMetrics.mountTime.toFixed(2)}ms`,
      'Total Load Time': `${totalLoadTime.toFixed(2)}ms`,
      'Memory Usage': (performance as any).memory ? {
        'Used JS Heap': `${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        'Total JS Heap': `${((performance as any).memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        'Heap Limit': `${((performance as any).memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      } : 'Not available',
    });

    // Log resource loading times
    const resources = performance.getEntriesByType('resource');
    const slowResources = resources
      .filter((resource: any) => resource.duration > 100)
      .sort((a: any, b: any) => b.duration - a.duration)
      .slice(0, 5);

    if (slowResources.length > 0) {
      console.log('🐌 Slow Resources (>100ms):', slowResources.map((r: any) => ({
        name: r.name.split('/').pop(),
        duration: `${r.duration.toFixed(2)}ms`,
        size: r.transferSize ? `${(r.transferSize / 1024).toFixed(2)} KB` : 'unknown',
      })));
    }
  }, 0);
} else {
  app.mount("#app");
}
