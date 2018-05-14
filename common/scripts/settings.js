const BROWSER = ENV

export const wsUrl = {
  apiUrl: 'https://api.windscribe.com',
  assetsUrl: 'https://assets.windscribe.com',
  rootUrl: 'https://windscribe.com/',
  pingUrl: 'https://ping.windscribe.com',
  exStartUrl: 'ext-start.windscribe.com',
  webStoreUrl:
    BROWSER === 'chrome'
      ? 'https://chrome.google.com/webstore/detail/windscribe-free-vpn-and-a/hnmpcagpplmpfojmgmnngilcnanddlhb/reviews?utm_source=chrome-ntp-icon'
      : 'https://addons.mozilla.org/en-US/firefox/addon/windscribe/',
  backupApiUrl: 'https://api.staticnetcontent.com',
  backupAssetsUrl: 'https://assets.staticnetcontent.com',
  backupPingUrl: 'https://ping.staticnetcontent.com',
  backupExStartUrl: 'ext-start.staticnetcontent.com',
  uninstallUrl: 'https://windscribe.com/uninstall/extension'
}

export const APIUrl = {
  secureLink: '/SecureLinks',
  session: '/Session',
  location: '/ServerLocations',
  pacFile: '/ServerPac',
  userAgentList: '/extension/useragents.txt',
  adList: '/extension/easylist.txt',
  trackersList: '/extension/easyprivacy.txt',
  antiSocialList: '/extension/fanboy-social.txt',
  // suffixList: "/libs/public_suffix_list.dat",
  recordInstall: '/RecordInstall/ext',
  reportWebsite: '/Report/whitelist',
  notifications: '/Notifications'
}

export const extensionLanguages = [
  {
    name: `عرب`,
    lngCode: 'ar',
    flagCode: 'EG'
  },
  {
    name: `Български`,
    lngCode: 'bg',
    flagCode: 'BG'
  },
  {
    name: `Český`,
    lngCode: 'cs',
    flagCode: 'CZ'
  },
  {
    name: `Dansk`,
    lngCode: 'da',
    flagCode: 'DK'
  },
  {
    name: `Deutsche`,
    lngCode: 'de',
    flagCode: 'DE'
  },
  {
    name: 'Ελληνικά',
    lngCode: 'el',
    flagCode: 'GR'
  },
  {
    name: 'English',
    lngCode: 'en',
    flagCode: 'GB'
  },
  {
    name: 'Español',
    lngCode: 'es',
    flagCode: 'ES'
  },
  {
    name: 'Français',
    lngCode: 'fr',
    flagCode: 'FR'
  },
  {
    name: 'עִבְרִית',
    lngCode: 'he',
    flagCode: 'IL'
  },
  {
    name: 'हिंदी',
    lngCode: 'hi',
    flagCode: 'IN'
  },
  {
    name: 'Indonesia',
    lngCode: 'id',
    flagCode: 'ID'
  },
  {
    name: `Italiano`,
    lngCode: 'it',
    flagCode: 'IT'
  },
  {
    name: `日本語`,
    lngCode: 'ja',
    flagCode: 'JP'
  },
  {
    name: `한국어`,
    lngCode: 'ko',
    flagCode: 'KR'
  },
  {
    name: `Nederlands`,
    lngCode: 'nl',
    flagCode: 'NL'
  },
  {
    name: `Polskie`,
    lngCode: 'pl',
    flagCode: 'PL'
  },
  {
    name: `Português`,
    lngCode: 'pt',
    flagCode: 'PT'
  },
  {
    name: `Русский`,
    lngCode: 'ru',
    flagCode: 'RU'
  },
  {
    name: `Słowacki`,
    lngCode: 'sk',
    flagCode: 'SK'
  },
  {
    name: `Svenska`,
    lngCode: 'sv',
    flagCode: 'SE'
  },
  {
    name: `Türk`,
    lngCode: 'tr',
    flagCode: 'TR'
  },
  {
    name: `Tiếng Việt`,
    lngCode: 'vi',
    flagCode: 'VN'
  },
  {
    name: `中文`,
    lngCode: 'zh',
    flagCode: 'CN'
  }
]

var settings = {
  WS_GRP_MAX: 1000,
  SHARED_SECRET: 'API_SECRET',
  /* ENDPOINT should start with protocol */
  ENDPOINT: wsUrl.apiUrl,
  LNK: {
    LNK_MY_ACC: wsUrl.rootUrl + 'myaccount',
    LNK_HLP: wsUrl.rootUrl + 'help',
    LNK_SEC_LINK_HLP: wsUrl.rootUrl + 'securelink',
    LNK_UPGRD: wsUrl.rootUrl + 'upgrade',
    LNK_PSSWRD_FRGT: wsUrl.rootUrl + 'forgotpassword',
    LNK_FRSTRUN: wsUrl.rootUrl + 'installed/extension?user_id={user_id}'
  },
  SRVC: {
    USERAGENTS: wsUrl.assetsUrl + '/extension/useragents.txt',
    EASYPRIVACY: wsUrl.assetsUrl + '/extension/easyprivacy.txt',
    FANBOY: wsUrl.assetsUrl + '/extension/fanboy-social.txt'
  },
  INTERVALS: {
    SESSION_UPDATE: 1,
    LOCATIONS_UPDATE: 3,
    NOTIFICATIONS: 60,
    ASSETS_UPDATE: 24 * 60
  },
  whitelistschemes:
    'about chrome file irc moz-safe-about news resource snews x-jsd addbook cid imap mailbox nntp pop data javascript moz-icon'
}

export default settings
