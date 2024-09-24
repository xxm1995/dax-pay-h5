import { warn } from '@/utils/log'
import { getAppEnvConfig } from '@/utils/env'
import type { GlobConfig } from '#/config'

export function useGlobSetting(): Readonly<GlobConfig> {
  const {
    VITE_GLOB_APP_TITLE,
    VITE_GLOB_APP_TITLE_CN,
    VITE_GLOB_API_URL,
    VITE_GLOB_APP_SHORT_NAME,
    VITE_GLOB_API_URL_PREFIX,
  } = getAppEnvConfig()

  if (!/[a-z_]*/i.test(VITE_GLOB_APP_SHORT_NAME)) {
    warn(
      `VITE_GLOB_APP_SHORT_NAME Variables can only be characters/underscores, please modify in the environment variables and re-running.`,
    )
  }

  // Take global configuration
  const glob: Readonly<GlobConfig> = {
    title: VITE_GLOB_APP_TITLE,
    titleCN: VITE_GLOB_APP_TITLE_CN,
    apiUrl: VITE_GLOB_API_URL,
    shortName: VITE_GLOB_APP_SHORT_NAME,
    urlPrefix: VITE_GLOB_API_URL_PREFIX,
  }
  return glob as Readonly<GlobConfig>
}
