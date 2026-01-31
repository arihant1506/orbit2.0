
// Manually declared types to avoid "Cannot find type definition file for 'vite/client'" error.

declare module '*.svg' {
  const svgContent: string;
  export default svgContent;
}

declare module '*.png' {
  const pngContent: string;
  export default pngContent;
}

declare module '*.jpg' {
  const jpgContent: string;
  export default jpgContent;
}

declare module '*.jpeg' {
  const jpegContent: string;
  export default jpegContent;
}

declare module '*.gif' {
  const gifContent: string;
  export default gifContent;
}

declare module '*.webp' {
  const webpContent: string;
  export default webpContent;
}

declare module '*.ico' {
  const icoContent: string;
  export default icoContent;
}

declare module '*.bmp' {
  const bmpContent: string;
  export default bmpContent;
}

declare module '*.avif' {
  const avifContent: string;
  export default avifContent;
}

interface ImportMetaEnv {
  [key: string]: any
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
