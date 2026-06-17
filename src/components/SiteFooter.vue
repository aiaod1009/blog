<template>
  <footer class="bg-surface-container-low border-t border-outline-variant">
    <div class="w-full py-12 px-margin-desktop max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
      <!-- 品牌 -->
      <div class="md:w-1/3">
        <a class="font-headline-md text-headline-md font-bold text-primary mb-4 block" href="#">
          MINIMALIST<span class="text-secondary font-mono text-sm ml-1">.dev</span>
        </a>
        <p class="text-on-surface-variant font-body-md text-body-md">
          一本致力于长篇数字阅读艺术和精致信息架构的期刊。
        </p>
      </div>

      <!-- 链接 -->
      <div class="flex flex-wrap gap-x-12 gap-y-6">
        <div class="flex flex-col gap-4">
          <span class="font-mono text-xs uppercase text-primary tracking-wider">Navigation</span>
          <a class="text-on-surface-variant font-mono text-xs hover:text-secondary transition-opacity opacity-80 hover:opacity-100 underline underline-offset-4" href="#">Privacy Policy</a>
          <a class="text-on-surface-variant font-mono text-xs hover:text-secondary transition-opacity opacity-80 hover:opacity-100 underline underline-offset-4" href="#">Terms of Use</a>
        </div>
        <div class="flex flex-col gap-4">
          <span class="font-mono text-xs uppercase text-primary tracking-wider">Connect</span>
          <a class="text-on-surface-variant font-mono text-xs hover:text-secondary transition-opacity opacity-80 hover:opacity-100 underline underline-offset-4" href="#">RSS Feed</a>
          <a class="text-on-surface-variant font-mono text-xs hover:text-secondary transition-opacity opacity-80 hover:opacity-100 underline underline-offset-4" href="#">Newsletter</a>
        </div>
      </div>
    </div>

    <!-- 版权 -->
    <div class="max-w-container-max mx-auto px-margin-desktop py-8 border-t border-outline-variant/30 text-center md:text-left">
      <p class="font-mono text-[11px] text-on-surface-variant">
        © 2024 Minimalist Blog. Compiled with precision.
      </p>
    </div>
  </footer>
</template>
