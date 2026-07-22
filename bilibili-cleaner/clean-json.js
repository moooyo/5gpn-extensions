// GPL-3.0-only native port of pinned kokoryh/Sparkle Bilibili transforms.

const TAB_LAYOUT = Object.freeze({
  tab: [
    { pos: 1, id: 731, name: '\u76f4\u64ad', tab_id: '\u76f4\u64adtab', uri: 'bilibili://live/home' },
    { pos: 2, id: 477, name: '\u63a8\u8350', tab_id: '\u63a8\u8350tab', uri: 'bilibili://pegasus/promo', default_selected: 1 },
    { pos: 3, id: 478, name: '\u70ed\u95e8', tab_id: '\u70ed\u95e8tab', uri: 'bilibili://pegasus/hottopic' },
    { pos: 4, id: 3502, name: '\u52a8\u753b', tab_id: 'bangumi', uri: 'bilibili://pgc/bangumi_v2' },
    { pos: 5, id: 3503, name: '\u5f71\u89c6', tab_id: 'film', uri: 'bilibili://pgc/cinema_v2' },
  ],
  top: [
    { pos: 1, id: 176, name: '\u6d88\u606f', tab_id: '\u6d88\u606fTop', uri: 'bilibili://link/im_home', icon: 'http://i0.hdslb.com/bfs/archive/d43047538e72c9ed8fd8e4e34415fbe3a4f632cb.png' },
  ],
  bottom: [
    { pos: 1, id: 177, name: '\u9996\u9875', tab_id: 'home', uri: 'bilibili://main/home/', icon: 'http://i0.hdslb.com/bfs/archive/63d7ee88d471786c1af45af86e8cb7f607edf91b.png', icon_selected: 'http://i0.hdslb.com/bfs/archive/e5106aa688dc729e7f0eafcbb80317feb54a43bd.png' },
    { pos: 2, id: 179, name: '\u52a8\u6001', tab_id: 'dynamic', uri: 'bilibili://following/home/', icon: 'http://i0.hdslb.com/bfs/archive/86dfbe5fa32f11a8588b9ae0fccb77d3c27cedf6.png', icon_selected: 'http://i0.hdslb.com/bfs/archive/25b658e1f6b6da57eecba328556101dbdcb4b53f.png' },
    { pos: 5, id: 181, name: '\u6211\u7684', tab_id: '\u6211\u7684Bottom', uri: 'bilibili://user_center/', icon: 'http://i0.hdslb.com/bfs/archive/4b0b2c49ffeb4f0c2e6a4cceebeef0aab1c53fe1.png', icon_selected: 'http://i0.hdslb.com/bfs/archive/a54a8009116cb896e64ef14dcf50e5cade401e00.png' },
  ],
})

const VIP_PROFILE = Object.freeze({
  status: 1,
  type: 2,
  due_date: 9005270400000,
  role: 15,
})

const REQUEST_LOCATION_PATTERN = /^https?:\/\/([^/:?#]+)(?::[0-9]+)?(\/[^?#]*)?(?:\?[^#]*)?$/i
const SPLASH_PATH_PATTERN = /^\/x\/v2\/splash\/(show|event\/list2)$/
const ACCOUNT_MINE_PATH_PATTERN = /^\/x\/v2\/account\/mine(\/ipad)?$/
const FEED_CARD_TYPES = new Set(['small_cover_v2', 'large_cover_single_v9', 'large_cover_v1'])
const STORY_BLOCKED_CARD_GOTOS = new Set(['vertical_ad_av', 'vertical_ad_live', 'vertical_ad_picture'])
const LIVE_FEED_BLOCKED_CARD_TYPES = new Set(['banner_v2', 'activity_card_v1'])
const ROOM_TAB_BLOCKED_IDS = new Set([33, 36, 162, 186])

const ACCOUNT_LAYOUT = Object.freeze({
  sectionsV2: [
    {
      items: [
        {
          id: 396,
          title: '\u79bb\u7ebf\u7f13\u5b58',
          uri: 'bilibili://user_center/download',
          icon: 'http://i0.hdslb.com/bfs/archive/5fc84565ab73e716d20cd2f65e0e1de9495d56f8.png',
          common_op_item: {},
        },
        {
          id: 397,
          title: '\u5386\u53f2\u8bb0\u5f55',
          uri: 'bilibili://user_center/history',
          icon: 'http://i0.hdslb.com/bfs/archive/8385323c6acde52e9cd52514ae13c8b9481c1a16.png',
          common_op_item: {},
        },
        {
          id: 3072,
          title: '\u6211\u7684\u6536\u85cf',
          uri: 'bilibili://user_center/favourite?version=2',
          icon: 'http://i0.hdslb.com/bfs/archive/d79b19d983067a1b91614e830a7100c05204a821.png',
          common_op_item: {},
        },
        {
          id: 2830,
          title: '\u7a0d\u540e\u518d\u770b',
          uri: 'bilibili://user_center/watch_later_v2',
          icon: 'http://i0.hdslb.com/bfs/archive/63bb768caa02a68cb566a838f6f2415f0d1d02d6.png',
          need_login: 1,
          common_op_item: {},
        },
      ],
      style: 1,
      button: {},
    },
    {
      title: '\u63a8\u8350\u670d\u52a1',
      items: [
        {
          id: 402,
          title: '\u4e2a\u6027\u88c5\u626e',
          uri: 'https://www.bilibili.com/h5/mall/home?navhide=1&f_source=shop&from=myservice',
          icon: 'http://i0.hdslb.com/bfs/archive/0bcad10661b50f583969b5a188c12e5f0731628c.png',
          common_op_item: {},
        },
        {
          id: 622,
          title: '\u4f1a\u5458\u8d2d',
          uri: 'bilibili://mall/home',
          icon: 'http://i0.hdslb.com/bfs/archive/19c794f01def1a267b894be84427d6a8f67081a9.png',
          common_op_item: {},
        },
        {
          id: 404,
          title: '\u6211\u7684\u94b1\u5305',
          uri: 'bilibili://bilipay/mine_wallet',
          icon: 'http://i0.hdslb.com/bfs/archive/f416634e361824e74a855332b6ff14e2e7c2e082.png',
          common_op_item: {},
        },
        {
          id: 406,
          title: '\u6211\u7684\u76f4\u64ad',
          uri: 'bilibili://user_center/live_center',
          icon: 'http://i0.hdslb.com/bfs/archive/1db5791746a0112890b77a0236baf263d71ecb27.png',
          common_op_item: {},
        },
      ],
      style: 1,
      button: {},
    },
    {
      title: '\u66f4\u591a\u670d\u52a1',
      items: [
        {
          id: 407,
          title: '\u8054\u7cfb\u5ba2\u670d',
          uri: 'bilibili://user_center/feedback',
          icon: 'http://i0.hdslb.com/bfs/archive/7ca840cf1d887a45ee1ef441ab57845bf26ef5fa.png',
          common_op_item: {},
        },
        {
          id: 410,
          title: '\u8bbe\u7f6e',
          uri: 'bilibili://user_center/setting',
          icon: 'http://i0.hdslb.com/bfs/archive/e932404f2ee62e075a772920019e9fbdb4b5656a.png',
          common_op_item: {},
        },
      ],
      style: 2,
      button: {},
    },
  ],
  ipadSections: [
    {
      id: 747,
      title: '\u79bb\u7ebf\u7f13\u5b58',
      uri: 'bilibili://user_center/download',
      icon: 'http://i0.hdslb.com/bfs/feed-admin/9bd72251f7366c491cfe78818d453455473a9678.png',
      mng_resource: { icon_id: 0, icon: '' },
    },
    {
      id: 748,
      title: '\u5386\u53f2\u8bb0\u5f55',
      uri: 'bilibili://user_center/history',
      icon: 'http://i0.hdslb.com/bfs/feed-admin/83862e10685f34e16a10cfe1f89dbd7b2884d272.png',
      mng_resource: { icon_id: 0, icon: '' },
    },
    {
      id: 749,
      title: '\u6211\u7684\u6536\u85cf',
      uri: 'bilibili://user_center/favourite',
      icon: 'http://i0.hdslb.com/bfs/feed-admin/6ae7eff6af627590fc4ed80c905e9e0a6f0e8188.png',
      mng_resource: { icon_id: 0, icon: '' },
    },
    {
      id: 750,
      title: '\u7a0d\u540e\u518d\u770b',
      uri: 'bilibili://user_center/watch_later',
      icon: 'http://i0.hdslb.com/bfs/feed-admin/928ba9f559b02129e51993efc8afe95014edec94.png',
      mng_resource: { icon_id: 0, icon: '' },
    },
  ],
  ipadUpperSections: [
    {
      id: 752,
      title: '\u521b\u4f5c\u9996\u9875',
      uri: '/uper/homevc',
      icon: 'http://i0.hdslb.com/bfs/feed-admin/d20dfed3b403c895506b1c92ecd5874abb700c01.png',
      mng_resource: { icon_id: 0, icon: '' },
    },
  ],
  ipadRecommendSections: [
    {
      id: 755,
      title: '\u6211\u7684\u5173\u6ce8',
      uri: 'bilibili://user_center/myfollows',
      icon: 'http://i0.hdslb.com/bfs/feed-admin/fdd7f676030c6996d36763a078442a210fc5a8c0.png',
      mng_resource: { icon_id: 0, icon: '' },
    },
    {
      id: 756,
      title: '\u6211\u7684\u6d88\u606f',
      uri: 'bilibili://link/im_home',
      icon: 'http://i0.hdslb.com/bfs/feed-admin/e1471740130a08a48b02a4ab29ed9d5f2281e3bf.png',
      mng_resource: { icon_id: 0, icon: '' },
    },
  ],
  ipadMoreSections: [
    {
      id: 763,
      title: '\u6211\u7684\u5ba2\u670d',
      uri: 'bilibili://user_center/feedback',
      icon: 'http://i0.hdslb.com/bfs/feed-admin/7801a6180fb67cf5f8ee05a66a4668e49fb38788.png',
      mng_resource: { icon_id: 0, icon: '' },
    },
    {
      id: 764,
      title: '\u8bbe\u7f6e',
      uri: 'bilibili://user_center/setting',
      icon: 'http://i0.hdslb.com/bfs/feed-admin/34e8faea00b3dd78977266b58d77398b0ac9410b.png',
      mng_resource: { icon_id: 0, icon: '' },
    },
  ],
})

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function isContainer(value) {
  return value !== null && typeof value === 'object'
}

function jqTruthy(value) {
  return value !== undefined && value !== null && value !== false
}

function promoteVip(vip) {
  if (vip == null) {
    return null
  }
  if (!isContainer(vip) || vip.status !== 0) {
    return vip
  }
  return Object.assign({}, vip, VIP_PROFILE)
}

function replaceChildren(container, value) {
  if (Array.isArray(container)) {
    container.fill(value)
    return
  }
  if (isContainer(container)) {
    for (const key of Object.keys(container)) {
      container[key] = value
    }
  }
}

function replaceGrandchildren(container, value) {
  if (!isContainer(container)) {
    return
  }
  const groups = Array.isArray(container) ? container : Object.values(container)
  for (const group of groups) {
    replaceChildren(group, value)
  }
}

function replaceAccountLayouts(data) {
  if (jqTruthy(data.sections_v2)) {
    data.sections_v2 = clone(ACCOUNT_LAYOUT.sectionsV2)
  }
  if (jqTruthy(data.ipad_sections)) {
    data.ipad_sections = clone(ACCOUNT_LAYOUT.ipadSections)
  }
  if (jqTruthy(data.ipad_upper_sections)) {
    data.ipad_upper_sections = clone(ACCOUNT_LAYOUT.ipadUpperSections)
  }
  if (jqTruthy(data.ipad_recommend_sections)) {
    data.ipad_recommend_sections = clone(ACCOUNT_LAYOUT.ipadRecommendSections)
  }
  if (jqTruthy(data.ipad_more_sections)) {
    data.ipad_more_sections = clone(ACCOUNT_LAYOUT.ipadMoreSections)
  }
}

function requestLocation(value) {
  const match = REQUEST_LOCATION_PATTERN.exec(value)
  if (!match) {
    throw new Error('Invalid request URL')
  }
  return {
    hostname: match[1].toLowerCase(),
    pathname: match[2] || '/',
  }
}

function cleanApp(path, document) {
  const data = document.data
  if (!data || typeof data !== 'object') {
    return document
  }

  if (SPLASH_PATH_PATTERN.test(path)) {
    if ('show' in data) data.show = []
    if ('event_list' in data) data.event_list = []
  } else if (path === '/x/resource/show/tab/v2') {
    data.tab = clone(TAB_LAYOUT.tab)
    data.top = clone(TAB_LAYOUT.top)
    data.bottom = clone(TAB_LAYOUT.bottom)
  } else if (path === '/x/v2/feed/index' && Array.isArray(data.items)) {
    data.items = data.items.filter((item) =>
      item && item.banner_item == null && item.ad_info == null &&
      item.card_goto === 'av' && FEED_CARD_TYPES.has(item.card_type))
  } else if (path === '/x/v2/feed/index/story' && Array.isArray(data.items)) {
    data.items = data.items.filter((item) =>
      !isContainer(item) || (item.ad_info == null && !STORY_BLOCKED_CARD_GOTOS.has(item.card_goto)))
    for (const item of data.items) {
      if (!isContainer(item)) continue
      delete item.story_cart_icon
      delete item.free_flow_toast
      delete item.image_infos
      delete item.course_info
      delete item.game_info
    }
  } else if (path === '/x/resource/show/skin') {
    delete data.common_equip
  } else if (ACCOUNT_MINE_PATH_PATTERN.test(path)) {
    delete data.answer
    delete data.live_tip
    delete data.vip_section
    delete data.vip_section_v2
    delete data.modular_vip_section
    data.vip_type = 2
    data.vip = promoteVip(data.vip)
    replaceAccountLayouts(data)
  } else if (path === '/x/v2/account/myinfo') {
    data.vip = promoteVip(data.vip)
  }

  return document
}

function cleanAPI(path, document) {
  if (path === '/x/pd-proxy/tracker') {
    replaceGrandchildren(document.data, 'stun.chat.bilibili.com:3478')
  } else if (path === '/pgc/view/v2/app/season' && isContainer(document.data)) {
    delete document.data.payment
  } else if (
    path === '/pgc/page/channel' &&
    isContainer(document.data) &&
    Array.isArray(document.data.modules)
  ) {
    document.data.modules = document.data.modules.filter((module) => {
      if (!isContainer(module) || module.type === 'TIP') return false
      if (
        module.type === 'BANNER' &&
        isContainer(module.module_data) &&
        Array.isArray(module.module_data.items)
      ) {
        module.module_data.items = module.module_data.items.filter((item) =>
          !isContainer(item) ||
          typeof item.url !== 'string' ||
          !item.url.startsWith('https://www.bilibili.com/blackboard/era/'))
      }
      return true
    })
  }
  return document
}

function cleanLive(path, document) {
  const data = document.data
  if (!data || typeof data !== 'object') {
    return document
  }

  if (path === '/xlive/open-interface/v2/tracker/conf') {
    data.domains = ['wss://tracker.chat.bilibili.com']
  } else if (path === '/xlive/app-interface/v2/index/feed' && Array.isArray(data.card_list)) {
    data.card_list = data.card_list.filter(
      (item) => !isContainer(item) || !LIVE_FEED_BLOCKED_CARD_TYPES.has(item.card_type),
    )
  } else if (path === '/xlive/app-room/v1/index/getInfoByRoom') {
    data.big_card_info = null
    data.show_reserve_status = false
    if (isContainer(data.reserve_info)) data.reserve_info.show_reserve_status = false
    if (isContainer(data.shopping_info)) data.shopping_info.is_show = 0
    if (isContainer(data.activity_banner_info)) replaceChildren(data.activity_banner_info, null)
    if (isContainer(data.function_card)) replaceChildren(data.function_card, null)
    if (isContainer(data.new_tab_info)) {
      if (Array.isArray(data.new_tab_info.outer_list)) {
        data.new_tab_info.outer_list = data.new_tab_info.outer_list.filter(
          (item) => !isContainer(item) || item.biz_id !== 33,
        )
      }
      if (
        Array.isArray(data.new_tab_info.candidate_list) &&
        Array.isArray(data.new_tab_info.v2_outer_list)
      ) {
        data.new_tab_info.candidate_list = data.new_tab_info.candidate_list.filter(
          (item) => !isContainer(item) || !ROOM_TAB_BLOCKED_IDS.has(item.biz_id),
        )
        for (const item of data.new_tab_info.v2_outer_list) {
          if (isContainer(item) && Array.isArray(item.indices)) {
            item.indices = item.indices.filter((id) => !ROOM_TAB_BLOCKED_IDS.has(id))
          }
        }
      }
    }
    if (isContainer(data.room_info) && data.room_info.short_id === 255) {
      data.room_info.background_render_type = 0
      data.room_info.app_background = 'https://i0.hdslb.com/bfs/new_dyn/2dd8a4aa9fde3587b1a716957a07337013999324.png'
    }
  } else if (path === '/xlive/app-room/v1/index/getInfoByUser') {
    delete data.play_together_info
    delete data.play_together_info_v2
    if (isContainer(data.function_card)) replaceChildren(data.function_card, null)
  }
  return document
}

function transform(context) {
  let document
  try {
    document = JSON.parse(context.response.body)
  } catch (error) {
    console.error(`Bilibili JSON decode failed: ${error}`)
    return null
  }

  const url = requestLocation(context.request.url)
  let cleaned = document
  if (url.hostname === 'app.bilibili.com') {
    cleaned = cleanApp(url.pathname, document)
  } else if (url.hostname === 'api.bilibili.com') {
    cleaned = cleanAPI(url.pathname, document)
  } else if (url.hostname === 'api.live.bilibili.com') {
    cleaned = cleanLive(url.pathname, document)
  }

  return {
    response: {
      body: JSON.stringify(cleaned),
    },
  }
}
