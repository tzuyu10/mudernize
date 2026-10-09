import {PHASE_DEVELOPMENT_SERVER} from 'next/constants.js'
/** @type {import('next').NextConfig} */
const shared = { experimental: { serverActions: { bodySizeLimit: '12mb' } } }
// Isolate development output; an optional directory supports concurrent build checks.
export default phase => ({
 ...shared,
 distDir:process.env.MUDERNIZE_BUILD_DIR || (phase===PHASE_DEVELOPMENT_SERVER?'.next-dev':'.next'),
})
