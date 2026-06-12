import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/**/*': ['./node_modules/@img/**/*', './node_modules/sharp/**/*'],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
