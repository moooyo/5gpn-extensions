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

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function requestLocation(value) {
  const match = /^https?:\/\/([^/:?#]+)(?::[0-9]+)?(\/[^?#]*)?(?:\?[^#]*)?$/i.exec(value)
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

  if (/^\/x\/v2\/splash\/(list|show|event\/list2)$/.test(path)) {
    if ('show' in data) data.show = []
    if ('event_list' in data) data.event_list = []
  } else if (path === '/x/resource/show/tab/v2') {
    data.tab = clone(TAB_LAYOUT.tab)
    data.top = clone(TAB_LAYOUT.top)
    data.bottom = clone(TAB_LAYOUT.bottom)
  } else if (path === '/x/v2/feed/index' && Array.isArray(data.items)) {
    const types = new Set(['small_cover_v2', 'large_cover_single_v9', 'large_cover_v1'])
    data.items = data.items.filter((item) =>
      item && item.banner_item == null && item.ad_info == null &&
      item.card_goto === 'av' && types.has(item.card_type))
  } else if (path === '/x/v2/feed/index/story' && Array.isArray(data.items)) {
    const blocked = new Set(['vertical_ad_av', 'vertical_ad_live', 'vertical_ad_picture'])
    data.items = data.items.filter((item) => item && item.ad_info == null && !blocked.has(item.card_goto))
    for (const item of data.items) {
      delete item.story_cart_icon
      delete item.free_flow_toast
      delete item.image_infos
      delete item.course_info
      delete item.game_info
    }
  } else if (/^\/x\/(resource\/(top\/activity|patch\/tab)|v2\/search\/square|vip\/ads\/materials)$/.test(path)) {
    return { code: -404, message: '-404', ttl: 1, data: null }
  } else if (path === '/x/resource/show/skin') {
    delete data.common_equip
  } else if (/^\/x\/v2\/account\/mine(\/ipad)?$/.test(path)) {
    delete data.answer
    delete data.live_tip
    delete data.vip_section
    delete data.vip_section_v2
    delete data.modular_vip_section
  }

  return document
}

function cleanAPI(path, document) {
  if (path === '/x/pd-proxy/tracker' && Array.isArray(document.data)) {
    for (const group of document.data) {
      if (Array.isArray(group)) {
        group.fill('stun.chat.bilibili.com:3478')
      }
    }
  } else if (path === '/pgc/activity/deliver/material/receive') {
    return {
      code: 0,
      data: { closeType: 'close_win', container: [], showTime: '' },
      message: 'success',
    }
  } else if (path === '/pgc/view/v2/app/season' && document.data) {
    delete document.data.payment
  }
  return document
}

function cleanLive(document) {
  const data = document.data
  if (!data || typeof data !== 'object') {
    return document
  }

  delete data.play_together_info
  delete data.play_together_info_v2
  delete data.activity_banner_info
  if (Array.isArray(data.function_card)) {
    data.function_card.fill(null)
  }
  if (Array.isArray(data.new_tab_info && data.new_tab_info.outer_list)) {
    data.new_tab_info.outer_list = data.new_tab_info.outer_list.filter(
      (item) => item && item.biz_id !== 33,
    )
  }
  if (Array.isArray(data.card_list)) {
    const blocked = new Set(['banner_v2', 'activity_card_v1'])
    data.card_list = data.card_list.filter((item) => item && !blocked.has(item.card_type))
  }
  if (data.show_reserve_status) data.show_reserve_status = false
  if (data.reserve_info && data.reserve_info.show_reserve_status) {
    data.reserve_info.show_reserve_status = false
  }
  if (data.shopping_info && data.shopping_info.is_show) {
    data.shopping_info.is_show = 0
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
    cleaned = cleanLive(document)
  }

  return {
    response: {
      body: JSON.stringify(cleaned),
    },
  }
}
