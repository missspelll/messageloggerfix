/**
 * @name MessageLoggerFix
 * @version 1.0.0
 * @description Saves all deleted and purged messages, as well as all edit history and ghost pings. With highly configurable ignore options, and even restoring deleted messages after restarting Discord.
 * @author missspelll
 * @source https://github.com/missspelll/messageloggerfix
 */



const ML_TYPE_L1 = Symbol('ML_TYPE_L1');
const ML_TYPE_L2 = Symbol('ML_TYPE_L2');
const ML_TYPE_L3 = Symbol('ML_TYPE_L3');

const { React } = BdApi;

module.exports = class MessageLoggerFix {
  getName() {
    return 'messageloggerfix';
  }
  getVersion() {
    return '1.0.0';
  }
  getAuthor() {
    return 'missspelll';
  }
  getDescription() {
    return 'Saves all deleted and purged messages, as well as all edit history and ghost pings. With highly configurable ignore options, and even restoring deleted messages after restarting Discord.';
  }
  load() { }
  start() {
    let onLoaded = () => {
      try {
        if (global.ZeresPluginLibrary && !this.UserStore) this.UserStore = ZeresPluginLibrary.WebpackModules.getByProps('getCurrentUser', 'getUser');
        if (!global.ZeresPluginLibrary || !this.UserStore || !(this.localUser = this.UserStore.getCurrentUser())) setTimeout(onLoaded, 1000);
        else this.initialize();
      } catch (err) {
        ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Failed to start!', err);
        ZeresPluginLibrary.Logger.err(this.getName(), `If you cannot solve this yourself, contact ${this.getAuthor()} and provide the errors shown here.`);
        this.stop();
        XenoLib.Notifications.error(`[**${this.getName()}**] Failed to start! Try to CTRL + R, or update the plugin, like so\n![image](https://i.imgur.com/tsv6aW8.png)`, { timeout: 0 });
      }
    };
    this.pluginDir = (BdApi.Plugins && BdApi.Plugins.folder) || '';
    this.dataDir = this.pluginDir + '/messageloggerfix-logs';
    try { const fs = require('fs'); if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true }); } catch(e) {}
    this.__isPowerCord = typeof global.isTab !== 'undefined';
    let XenoLibOutdated = false;
    let ZeresPluginLibraryOutdated = false;
    if (global.BdApi && BdApi.Plugins && typeof BdApi.Plugins.get === 'function' /* you never know with those retarded client mods */) {
      const versionChecker = (a, b) => ((a = a.split('.').map(a => parseInt(a))), (b = b.split('.').map(a => parseInt(a))), !!(b[0] > a[0])) || !!(b[0] == a[0] && b[1] > a[1]) || !!(b[0] == a[0] && b[1] == a[1] && b[2] > a[2]);
      const isOutOfDate = (lib, minVersion) => lib && lib._config && lib._config.info && lib._config.info.version && versionChecker(lib._config.info.version, minVersion) || typeof global.isTab !== 'undefined';
      let iXenoLib = BdApi.Plugins.get('XenoLib');
      let iZeresPluginLibrary = BdApi.Plugins.get('ZeresPluginLibrary');
      if (iXenoLib && iXenoLib.instance) iXenoLib = iXenoLib.instance;
      if (iZeresPluginLibrary && iZeresPluginLibrary.instance) iZeresPluginLibrary = iZeresPluginLibrary.instance;
      if (isOutOfDate(iXenoLib, '1.4.29')) XenoLibOutdated = true;
      if (isOutOfDate(iZeresPluginLibrary, '2.0.23')) ZeresPluginLibraryOutdated = true;
    }
    if (/* !global.XenoLib || !global.ZeresPluginLibrary || XenoLibOutdated || ZeresPluginLibraryOutdated */!BdApi.Plugins.get('XenoLib') || XenoLibOutdated) {
      this._XL_PLUGIN = true;
      // asking people to do simple tasks is stupid, relying on stupid modals that are *supposed* to help them is unreliable
      // forcing the download on enable is good enough
      const fs = require('fs');
      const path = require('path');
      const pluginsDir = (BdApi.Plugins && BdApi.Plugins.folder) || '';
      const xenoLibPath = path.join(pluginsDir, '1XenoLib.plugin.js');
      BdApi.Net.fetch('https://raw.githubusercontent.com/missspelll/messageloggerfix/main/1XenoLib.plugin.js', { headers: { origin: 'discord.com' } })
        .then(r => {
          if (!r.ok) {
            throw new Error('Network request threw error ' + r.statusText);
          }
          return r.text();
        })
        .then(data => {
          fs.writeFileSync(xenoLibPath, data);
        })
        .catch(err => {
          console.error('Error downloading XenoLib!', err);
          BdApi.UI.showConfirmationModal('XenoLib Missing',
            `XenoLib is missing! Click the link below to download it, then put it in your plugins folder!

You can find the plugins folder by going to Settings > Plugins and clicking the folder icon!

https://astranika.com/bd/download?plugin=1XenoLib`, {
            confirmText: 'Got it',
            cancelText: null
          });
        });
    } else onLoaded();
  }
  stop() {
    try {
      this.shutdown();
      const currLocation = globalThis?.location?.pathname;
      ZeresPluginLibrary?.DiscordModules?.NavigationUtils?.transitionTo('/channels/@me'); // dirty fix for crash
      if (currLocation) setTimeout(() => ZeresPluginLibrary.DiscordModules.NavigationUtils.transitionTo(currLocation), 500);
    } catch (err) {
      // ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Failed to stop!', err);
    }
  }
  getChanges() {
    return [
      {
        title: 'Fixed',
        type: 'fixed',
        items: [
          'Renamed plugin to messageloggerfix.',
          'Fixed compatibility with modern BetterDiscord.',
          'Replaced deprecated electron.remote and require(request) usage.',
          'Fixed React 18 compatibility issues.',
          'Fixed auto-update using fetch instead of deprecated https module pattern.',
          'Removed dependency on mime-types module.'
        ]
      }
    ];
  }
  initialize() {
    if (this.__started) return XenoLib.Notifications.warning(`[**${this.getName()}**] Tried to start twice..`, { timeout: 0 });
    this.__started = true;
    /*
     * why are we letting Zere, the braindead American let control BD when he can't even
     * fucking read clearly documented and well known standards, such as __filename being
     * the files full fucking path and not just the filename itself, IS IT REALLY SO HARD
     * TO FUCKING READ?! https://nodejs.org/api/modules.html#modules_filename
     */
    const _zerecantcode_path = require('path');
    const theActualFileNameZere = _zerecantcode_path.join(__dirname, _zerecantcode_path.basename(__filename));
    XenoLib.changeName(theActualFileNameZere, 'messageloggerfix'); /* To everyone who renames plugins: FUCK YOU! */
    try {
      ZeresPluginLibrary.WebpackModules.getByProps('openModal', 'hasModalOpen').closeModal(`${this.getName()}_DEP_MODAL`);
    } catch (e) { }
    // force update
    try {
      ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), 'https://raw.githubusercontent.com/missspelll/messageloggerfix/main/messageloggerfix.plugin.js');
    } catch (err) { }
    if (window.PluginUpdates && window.PluginUpdates.plugins) delete PluginUpdates.plugins['https://raw.githubusercontent.com/missspelll/messageloggerfix/main/messageloggerfix.plugin.js'];
    if (BdApi.Plugins && BdApi.Plugins.get('NoDeleteMessages') && BdApi.Plugins.isEnabled('NoDeleteMessages')) XenoLib.Notifications.warning(`[**${this.getName()}**] Using **NoDeleteMessages** with **${this.getName()}** is completely unsupported and will cause issues. Please either disable **NoDeleteMessages** or delete it to avoid issues.`, { timeout: 0 });
    if (BdApi.Plugins && BdApi.Plugins.get('SuppressUserMentions') && BdApi.Plugins.isEnabled('SuppressUserMentions')) XenoLib.Notifications.warning(`[**${this.getName()}**] Using **SuppressUserMentions** with **${this.getName()}** is completely unsupported and will cause issues. Please either disable **SuppressUserMentions** or delete it to avoid issues.`, { timeout: 0 });
    const shouldPass = e => e && e.constructor && typeof e.constructor.name === 'string' && e.constructor.name.indexOf('HTML');
    let defaultSettings = {
      obfuscateCSSClasses: true,
      autoBackup: false,
      dontSaveData: false,
      displayUpdateNotes: true,
      ignoreMutedGuilds: true,
      ignoreMutedChannels: true,
      ignoreBots: true,
      ignoreSelf: false,
      ignoreBlockedUsers: true,
      ignoreNSFW: false,
      ignoreLocalEdits: false,
      ignoreLocalDeletes: false,
      alwaysLogGhostPings: false,
      showOpenLogsButton: true,
      messageCacheCap: 1000,
      savedMessagesCap: 1000,
      reverseOrder: true,
      onlyLogWhitelist: false,
      whitelist: [],
      blacklist: [],
      notificationBlacklist: [],
      toastToggles: {
        sent: false,
        edited: true,
        deleted: true,
        ghostPings: true
      },
      toastTogglesDMs: {
        sent: false,
        edited: true,
        deleted: true,
        ghostPings: true,
        disableToastsForLocal: false
      },
      useNotificationsInstead: true,
      blockSpamEdit: false,
      disableKeybind: false,
      cacheAllImages: true,
      dontDeleteCachedImages: false,
      aggresiveMessageCaching: true,
      // openLogKeybind: [
      //   /* 162, 77 */
      // ], // ctrl + m on windows
      // openLogFilteredKeybind: [
      //   /* 162, 78 */
      // ], // ctrl + n on windows
      renderCap: 50,
      maxShownEdits: 5,
      hideNewerEditsFirst: true,
      displayDates: true,
      deletedMessageColor: '',
      editedMessageColor: '',
      useAlternativeDeletedStyle: false,
      showEditedMessages: true,
      showDeletedMessages: true,
      showPurgedMessages: true,
      showDeletedCount: true,
      showEditedCount: true,
      alwaysLogSelected: true,
      alwaysLogDM: true,
      restoreDeletedMessages: true,
      contextmenuSubmenuName: 'MessageLoggerFix',
      streamSafety: {
        showEdits: false,
        showDeletes: false,
        showButton: false,
        showNotifications: false,
        showContextMenu: false
      },
      imageCacheDir: this.dataDir + '/ML_IMAGE_CACHE',
      flags: 0,
      autoUpdate: true,
      skipClearConfirm: false,
      versionInfo: ''
    };
    const Flags = {
      STOLEN: 1 << 0,
      STARTUP_HELP: 1 << 1
    };

    this.settings = ZeresPluginLibrary.PluginUtilities.loadSettings(this.getName(), defaultSettings);
    let settingsChanged = false;

    if (!this.settings || !Object.keys(this.settings).length) {
      XenoLib.Notifications.error(`[${this.getName()}] Settings file corrupted! All settings restored to default.`, { timeout: 0 });
      this.settings = defaultSettings; // todo: does defaultSettings get changed?
      settingsChanged = true;
    }
    if (this.settings.versionInfo === '1.7.55') {
      this.settings = defaultSettings; // bad default settings
      settingsChanged = true;
    }
    // if (!this.settings.openLogKeybind.length) {
    //   this.settings.openLogKeybind = [162, 77];
    //   settingsChanged = true;
    // }
    // if (!this.settings.openLogFilteredKeybind.length) {
    //   this.settings.openLogFilteredKeybind = [162, 78];
    //   settingsChanged = true;
    // }

    if (this.settings.autoUpdate) {
      if (this._autoUpdateInterval) clearInterval(this._autoUpdateInterval);
      this._autoUpdateInterval = setInterval(_ => this.automaticallyUpdate(), 1000 * 60 * 60); // 1 hour
      this.automaticallyUpdate();
    }
    if (this.settings.versionInfo !== this.getVersion()) {
      this.settings.versionInfo = this.getVersion();
      this.saveSettings();
      settingsChanged = false;
    }

    if (settingsChanged) this.saveSettings();

    this.nodeModules = {
      electron: (() => { try { return require('electron'); } catch(e) { return {}; } })(),
      fs: require('fs'),
      path: require('path')
    };

    let defaultConstruct = () => {
      return Object.assign(
        {},
        {
          messageRecord: {},
          deletedMessageRecord: {},
          editedMessageRecord: {},
          purgedMessageRecord: {}
        }
      );
    };
    // Custom loader that reads from our subfolder
    const loadFromDataDir = (name, key, fallback) => {
      try {
        const filePath = this.nodeModules.path.join(this.dataDir, `${name}.config.json`);
        if (this.nodeModules.fs.existsSync(filePath)) {
          const raw = JSON.parse(this.nodeModules.fs.readFileSync(filePath, 'utf8'));
          return raw[key] || fallback;
        }
      } catch(e) {}
      // Fallback: try XenoLib/BD default location (for migration)
      try { return XenoLib.loadData(name, key, fallback, true); } catch(e) {}
      return fallback;
    };

    let data;
    if (this.settings.dontSaveData) {
      data = defaultConstruct();
    } else {
      data = loadFromDataDir(this.getName() + 'Data', 'data', defaultConstruct());
      const isBad = map => !(map && map.messageRecord && map.editedMessageRecord && map.deletedMessageRecord && map.purgedMessageRecord && typeof map.messageRecord == 'object' && typeof map.editedMessageRecord == 'object' && typeof map.deletedMessageRecord == 'object' && typeof map.purgedMessageRecord == 'object');
      if (isBad(data)) {
        if (this.settings.autoBackup) {
          data = loadFromDataDir(this.getName() + 'DataBackup', 'data', defaultConstruct());
          if (isBad(data)) {
            XenoLib.Notifications.error(`[${this.getName()}] Data and backup files were corrupted. All deleted/edited/purged messages have been erased.`, { timeout: 0 });
            data = defaultConstruct();
          } else {
            XenoLib.Notifications.warning(`[${this.getName()}] Data was corrupted, loaded backup!`, { timeout: 5000 });
          }
        } else {
          XenoLib.Notifications.error(`[${this.getName()}] Data was corrupted! Recommended to turn on auto backup in settings! All deleted/edited/purged messages have been erased.`, { timeout: 0 });
          data = defaultConstruct();
        }
      }
    }
    /*
    const dataFileSize = this.nodeModules.fs.statSync(this.pluginDir + '/messageloggerfix-data.config.json').size / 1024 / 1024;
    // SEVERITY
    // 0 OK < 5MiB
    // 1 MILD < 10MiB
    // 2 DANGER < 20MiB
    // 3 EXTREME > 20MiB
    this.slowSaveModeStep = dataFileSize > 20 ? 3 : dataFileSize > 10 ? 2 : dataFileSize > 5 ? 1 : 0;
    ZeresPluginLibrary.Logger.info(this.getName(), `Data file size is ${dataFileSize.toFixed(2)}MB`);
    if (this.slowSaveModeStep) ZeresPluginLibrary.Logger.warn(this.getName(), 'Data file is too large, severity level', this.slowSaveModeStep);
*/

    this.messageStore = ZeresPluginLibrary.WebpackModules.getByProps('focusedMessageId', 'getMessages', 'getMessage');

    this.ChannelStore = ZeresPluginLibrary.WebpackModules.getByProps('getChannel', 'getDMFromUserId');
    if (!this.settings.dontSaveData) {
      const records = data.messageRecord;
      // data structure changed a wee bit, compensate instead of deleting user data or worse, erroring out
      for (let a in records) {
        const record = records[a];
        if (record.deletedata) {
          if (record.deletedata.deletetime) {
            record.delete_data = {};
            record.delete_data.time = record.deletedata.deletetime;
          }
          delete record.deletedata;
        } else if (record.delete_data && typeof record.delete_data.rel_ids !== 'undefined') delete record.delete_data.rel_ids;
        if (record.editHistory) {
          record.edit_history = [];
          for (let b in record.editHistory) {
            record.edit_history.push({ content: record.editHistory[b].content, time: record.editHistory[b].editedAt });
          }
          delete record.editHistory;
        }
        record.message = this.cleanupMessageObject(record.message); // fix up our past mistakes by sweeping it under the rug!
      }
    }

    this.cachedMessageRecord = [];
    this.messageRecord = data.messageRecord;
    this.deletedMessageRecord = data.deletedMessageRecord;
    this.editedMessageRecord = data.editedMessageRecord;
    this.purgedMessageRecord = data.purgedMessageRecord;
    this.tempEditedMessageRecord = {};
    this.editHistoryAntiSpam = {};
    this.localDeletes = [];

    this.settings.imageCacheDir = this.dataDir + '/ML_IMAGE_CACHE';

    const imageCacheDirFailure = () => {
      this.settings.imageCacheDir = this.dataDir + '/ML_IMAGE_CACHE';
      XenoLib.Notifications.error(`[**${this.getName()}**] Failed to access custom image cache dir. It has been reset to plugins folder!`);
    };

    if (this.settings.cacheAllImages && !this.nodeModules.fs.existsSync(this.settings.imageCacheDir)) {
      try {
        this.nodeModules.fs.mkdirSync(this.settings.imageCacheDir);
      } catch (e) {
        imageCacheDirFailure();
      }
    }

    if (!this._imageCacheServer) {
      const mimeTypes = {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.bmp': 'image/bmp', '.webp': 'image/webp',
        '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
      };
      class ImageCacheServer {
        constructor(imagePath, name) {
          try {
            ZeresPluginLibrary.WebpackModules.getByProps('bindAll', 'debounce').bindAll(this, ['_requestHandler', '_errorHandler']);
            this._server = require('http').createServer(this._requestHandler);
            this._parseURL = require('url').parse;
            this._fs = require('fs');
            this._path = require('path');
            this._imagePath = imagePath;
            this._name = name;
          } catch (err) {
            ZeresPluginLibrary.Logger.warn(this._name, 'ImageCacheServer unavailable', err);
          }
        }
        start() {
          try {
            if (this._server) this._server.listen(7474, 'localhost', this._errorHandler);
          } catch (err) {
            ZeresPluginLibrary.Logger.warn(this._name, 'ImageCacheServer failed to start', err);
          }
        }
        stop() {
          try {
            if (this._server) this._server.close();
          } catch (err) { }
        }
        _errorHandler(err) {
          if (err) return ZeresPluginLibrary.Logger.err(this._name, 'Error in ImageCacheServer', err);
          ZeresPluginLibrary.Logger.info(this._name, 'ImageCacheServer: OK');
        }
        _requestHandler(req, res) {
          const parsedUrl = this._parseURL(req.url);
          const parsedFile = this._path.parse(parsedUrl.pathname);
          let pathname = this._path.join(this._imagePath, parsedFile.base);
          this._fs.readFile(pathname, (err, data) => {
            if (err) {
              res.statusCode = 404;
              res.end(`No such file: ${err}.`);
            } else {
              res.setHeader('Content-type', mimeTypes[parsedFile.ext.toLowerCase()] || 'application/octet-stream');
              res.end(data);
            }
          });
        }
      }
      this._imageCacheServer = new ImageCacheServer(this.settings.imageCacheDir, this.getName());
    }
    this._imageCacheServer.start();

    defaultConstruct = undefined;

    /* backport from MLV3/rewrite */
    const CUser = ZeresPluginLibrary.WebpackModules.getByPrototypes('getAvatarSource', 'isLocalBot');
    const userRecord = {};
    const lastSeenUser = {};
    for (const messageId in this.messageRecord) {
      const record = this.messageRecord[messageId];
      const userObj = record.message.author;
      if (!userObj || typeof userObj === 'string') continue;
      const date = new Date(record.message.timestamp);
      if (!(userRecord[userObj.id] && lastSeenUser[userObj.id] && lastSeenUser[userObj.id] > date)) {
        userRecord[userObj.id] = userObj;
        lastSeenUser[userObj.id] = date;
      }
    }

    this.Patcher = XenoLib.createSmartPatcher({ before: (moduleToPatch, functionName, callback, options = {}) => ZeresPluginLibrary.Patcher.before(this.getName(), moduleToPatch, functionName, callback, options), instead: (moduleToPatch, functionName, callback, options = {}) => ZeresPluginLibrary.Patcher.instead(this.getName(), moduleToPatch, functionName, callback, options), after: (moduleToPatch, functionName, callback, options = {}) => ZeresPluginLibrary.Patcher.after(this.getName(), moduleToPatch, functionName, callback, options) });

    this.unpatches = [];

    this.unpatches.push(
      this.Patcher.after(this.UserStore, 'getUser', (_this, args, ret) => {
        if (!ret && !args[1]) {
          const userId = args[0];
          const users = this.UserStore.getUsers();
          if (userRecord[userId]) return (users[userId] = new CUser(userRecord[userId]));
        }
      })
    );

    const isMentioned = ZeresPluginLibrary.WebpackModules.getModule(e => typeof e === 'function' && e?.toString()?.includes('mentionEveryone') && e?.toString()?.includes('roles.includes'), { searchExports: true });

    this.tools = {
      openUserContextMenu: null /* NeatoLib.Modules.get('openUserContextMenu').openUserContextMenu */, // TODO: move here
      getMessage: this.messageStore.getMessage,
      fetchMessages: ZeresPluginLibrary.DiscordModules.MessageActions.fetchMessages.bind(ZeresPluginLibrary.DiscordModules.MessageActions),
      transitionTo: null /* NeatoLib.Modules.get('transitionTo').transitionTo */,
      getChannel: this.ChannelStore.getChannel,
      copyToClipboard: (text) => navigator.clipboard.writeText(text),
      getServer: ZeresPluginLibrary.WebpackModules.getByProps('getGuild', 'getGuildCount').getGuild,
      getUser: this.UserStore.getUser,
      parse: ZeresPluginLibrary.WebpackModules.getByProps('parse', 'astParserFor').parse,
      getUserAsync: /* ZeresPluginLibrary.WebpackModules.getByProps('getUser', 'acceptAgreements').getUser */ () => Promise.resolve(),
      isBlocked: ZeresPluginLibrary.WebpackModules.getByProps('isBlocked').isBlocked,
      createMomentObject: ZeresPluginLibrary.WebpackModules.getByProps('createFromInputFallback'),
      isMentioned: (e, id) => isMentioned({ userId: id, channelId: e.channel_id, mentionEveryone: e.mentionEveryone || e.mention_everyone, mentionUsers: e.mentions.map(e => e.id || e), mentionRoles: e.mentionRoles || e.mention_roles, mentionGames: [] }),
      DiscordUtils: ZeresPluginLibrary.WebpackModules.getByProps('bindAll', 'debounce')
    };

    this.createButton.classes = {
      button: (function () {
        let buttonData = ZeresPluginLibrary.WebpackModules.getByProps('button', 'colorBrand');
        return `${buttonData.button} ${buttonData.lookFilled} ${buttonData.colorBrand} ${buttonData.sizeSmall} ${buttonData.grow}`;
      })(),
      buttonContents: ZeresPluginLibrary.WebpackModules.getByProps('button', 'colorBrand').contents
    };

    this.safeGetClass = (func, fail, heckoff) => {
      try {
        return func();
      } catch (e) {
        if (heckoff) return fail;
        return fail + '-ML';
      }
    };

    this.createMessageGroup.classes = {
      containerBounded: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').containerCozyBounded, 'containerCozyBounded'),
      message: this.safeGetClass(() => `.${ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').containerCozyBounded.split(/ /g)[0]} > div`, '.containerCozyBounded-ML > div', true),
      header: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').headerCozy, 'headerCozy'),
      avatar: this.safeGetClass(() => XenoLib.getClass('header avatar', true), 'avatar'),
      headerMeta: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').headerCozyMeta, 'headerCozyMeta'),
      username: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').username, 'username'),
      timestamp: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').timestampCozy, 'timestampCozy'),
      timestampSingle: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').timestampCozy.split(/ /g)[0], 'timestampCozy'),
      content: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').contentCozy, 'contentCozy'),
      avatarSingle: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').avatar.split(/ /g)[0], 'avatar'),
      avatarImg: XenoLib.getClass('clickable avatar'),
      avatarImgSingle: XenoLib.getSingleClass('clickable avatar'),
      botTag: ZeresPluginLibrary.WebpackModules.getByProps('botTagRegular').botTagRegular + ' ' + ZeresPluginLibrary.WebpackModules.getByProps('botTagCozy').botTagCozy,
      markupSingle: ZeresPluginLibrary.WebpackModules.getByProps('markup').markup.split(/ /g)[0]
    };

    this.multiClasses = {
      defaultColor: ZeresPluginLibrary.WebpackModules.getByProps('defaultColor').defaultColor,
      item: ZeresPluginLibrary.WebpackModules.find(m => m.item && m.selected && m.topPill).item,
      /* tabBarItem: ZeresPluginLibrary.DiscordClassModules.UserModal.tabBarItem, */
      tabBarContainer: ZeresPluginLibrary.DiscordClassModules.UserModal?.tabBarContainer,
      tabBar: ZeresPluginLibrary.DiscordClassModules.UserModal?.tabBar,
      edited: XenoLib.joinClassNames(XenoLib.getClass('separator timestamp'), XenoLib.getClass('separator timestampInline')),
      markup: ZeresPluginLibrary.WebpackModules.getByProps('markup')['markup'],
      message: {
        cozy: {
          containerBounded: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').containerCozyBounded, 'containerCozyBounded'),
          header: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').headerCozy, 'headerCozy'),
          avatar: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').avatar, 'avatar'),
          headerMeta: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').headerCozyMeta, 'headerCozyMeta'),
          username: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').username, 'username'),
          timestamp: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').timestampCozy, 'timestampCozy'),
          content: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').contentCozy, 'contentCozy')
        }
      }
    };

    this.classes = {
      markup: ZeresPluginLibrary.WebpackModules.getByProps('markup')['markup'].split(/ /g)[0],
      hidden: ZeresPluginLibrary.WebpackModules.getByProps('spoilerContent', 'hidden').hidden.split(/ /g)[0],
      /* messages: this.safeGetClass(
        () => `.${ZeresPluginLibrary.WebpackModules.getByProps('container', 'containerCompactBounded').container.split(/ /g)[0]} > div:not(.${ZeresPluginLibrary.WebpackModules.getByProps('content', 'marginCompactIndent').content.split(/ /g)[0]})`,
        this.safeGetClass(() => `.${XenoLib.getSingleClass('scroller messages')} > .${XenoLib.getSingleClass('channelTextArea message')}`, 'ml-fallback-selector'),
        true
      ), not even used...? */
      avatar: this.safeGetClass(() => XenoLib.getSingleClass('header avatar', true), 'avatar-ML')
    };

    this.muteModule = ZeresPluginLibrary.WebpackModules.find(m => m.isChannelMuted);

    this.menu = {};
    this.menu.classes = {};
    this.menu.filter = '';
    this.menu.open = false;;

    const chatContent = ZeresPluginLibrary.WebpackModules.getByProps('chatContent');
    this.observer.chatContentClass = ((chatContent && chatContent.chatContent) || 'chat-3bRxxu').split(/ /g)[0];
    this.observer.chatClass = XenoLib.getClass('chatContent chat') || 'chat_f75fb0';
    this.observer.titleClass = !chatContent ? 'ERROR-CLASSWTF' : ZeresPluginLibrary.WebpackModules.getByProps('title', 'chatContent').title.split(/ /g)[0];
    this.observer.containerCozyClass = this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').containerCozyBounded.split(/ /g)[0], 'containerCozyBounded');

    this.localUser = this.UserStore.getCurrentUser();

    this.deletedChatMessagesCount = {};
    this.editedChatMessagesCount = {};

    this.channelMessages = ZeresPluginLibrary.WebpackModules.find(m => m._channelMessages)._channelMessages;

    this.autoBackupSaveInterupts = 0;

    // have to patch (what was previously named) messageHasExpiredAttachmentUrl, otherwise Discord will needlessly
    // reload the channel causing scrolling issues, quite annoying!
    const AttachmentUtils = BdApi.Webpack.getBySource('(["/attachments/","/ephemeral-attachments/"])');

    if (AttachmentUtils) {
      try {
        const targetName = Object.keys(AttachmentUtils).find(e => AttachmentUtils[e].toString().match(/return \w\.attachments\.some\(\w\)\|\|\w\.embeds\.some\(\w\)/));
        if (!targetName) throw new Error('Failed to find targetName');
        this.unpatches.push(
          this.Patcher.instead(AttachmentUtils, targetName, (_, args, original) => {
            const [message] = args;
            // check if ID is in messageRecord and force return false
            if (message.id && this.messageRecord[message.id]) return false;

            // run original otherwise to not interfere
            return original(...args);
          }
          )
        );
      } catch (e) {
        ZeresPluginLibrary.Logger.warn(this.getName(), 'Failed to patch AttachmentUtils!', e);
      }
    } else ZeresPluginLibrary.Logger.warn(this.getName(), 'Failed to find AttachmentUtils!');



    // unsure if this will stay functional, but last time I checked this ONLY returns the correct dispatcher since this specific filter
    // only matches all stores that use the main dispatcher
    this.dispatcher = BdApi.Webpack.getByKeys('_dispatcher')?._dispatcher;

    if (!this.dispatcher) {
      ZeresPluginLibrary.Logger.err(this.getName(), 'Failed to find Dispatcher!');
      XenoLib.Notifications.error(`[**${this.getName()}**] Failed to start plugin! Critical error: dispatcher not found!`);
      return;
    }

    this.unpatches.push(
      this.Patcher.instead(
        this.dispatcher,
        'dispatch',
        (_, args, original) => this.onDispatchEvent(args, original)
      )
    );
    this.unpatches.push(
      this.Patcher.instead(ZeresPluginLibrary.DiscordModules.MessageActions, 'startEditMessage', (_, args, original) => {
        const channelId = args[0];
        const messageId = args[1];
        if (this.deletedMessageRecord[channelId] && this.deletedMessageRecord[channelId].indexOf(messageId) !== -1) return;
        return original(...args);
      })
    );

    this.noTintIds = [];
    this.editModifiers = {};

    this.style = {};

    this.style.deleted = this.obfuscatedClass('ml2-deleted');
    this.style.deletedAlt = this.obfuscatedClass('ml2-deleted-alt');
    this.style.edited = this.obfuscatedClass('ml2-edited');
    this.style.editedCompact = this.obfuscatedClass('ml2-edited-compact');
    this.style.tab = this.obfuscatedClass('ml2-tab');
    this.style.tabSelected = this.obfuscatedClass('ml2-tab-selected');
    this.style.textIndent = this.obfuscatedClass('ml2-help-text-indent');
    this.style.menuModalLarge = this.obfuscatedClass('MLv2-menu-modal-large');
    this.style.menu = this.obfuscatedClass('ML-MENU');
    this.style.openLogs = this.obfuscatedClass('ML-OL');
    this.style.filter = this.obfuscatedClass('ML-FILTER');
    this.style.menuMessages = this.obfuscatedClass('ML-MENU-MESSAGES');
    this.style.menuTabBar = this.obfuscatedClass('ML-MENU-TABBAR');
    this.style.menuRoot = this.obfuscatedClass('MLv2-menu-root');
    this.style.imageRoot = this.obfuscatedClass('MLv2-image-root');
    this.style.inputWrapper = this.obfuscatedClass('MLv2-input-wrapper');
    this.style.multiInput = this.obfuscatedClass('MLv2-input');
    this.style.multiInputFirst = this.obfuscatedClass('MLv2-input-first');
    this.style.input = this.obfuscatedClass('MLv2-input-input');
    this.style.questionMark = this.obfuscatedClass('MLv2-question-mark');
    this.style.tabBarContainer = this.obfuscatedClass('MLv2-tab-bar-container');
    this.style.tabBar = this.obfuscatedClass('MLv2-tab-bar');
    this.style.tabBarItem = this.obfuscatedClass('MLv2-tab-bar-item');

    this.invalidateAllChannelCache();
    this.selectedChannel = this.getSelectedTextChannel();
    if (this.selectedChannel) this.cacheChannelMessages(this.selectedChannel.id);

    ZeresPluginLibrary.PluginUtilities.addStyle(
      (this.style.css = !this.settings.obfuscateCSSClasses ? 'ML-CSS' : this.randomString()),
      `
                /* ===== Deleted message styles ===== */
                [data-ml-deleted="true"] div[id^="message-content"] {
                    color: #f04747 !important;
                }
                [data-ml-deleted="true"] div[id^="message-content"] * {
                    color: #f04747 !important;
                }
                .${this.style.deleted} .${this.classes.markup} {
                    color: #f04747 !important;
                }
                .${this.style.deleted} .${this.classes.markup} * {
                    color: #f04747 !important;
                }
                html #app-mount .${this.style.deletedAlt} {
                  background-color: rgba(240, 71, 71, 0.15) !important;
                }
                html #app-mount .${this.style.deletedAlt}:hover, html #app-mount .${this.style.deletedAlt}.selected-2P5D_Z {
                  background-color: rgba(240, 71, 71, 0.10) !important;
                }

                /* ===== Edited message styles ===== */
                .${this.style.edited} .${this.style.edited},
                [class*="markup"].${this.style.edited} .${this.style.edited} {
                    filter: brightness(70%);
                }
                .theme-light .${this.style.edited} .${this.style.edited},
                .theme-light [class*="markup"].${this.style.edited} .${this.style.edited} {
                    opacity: 0.5;
                }
                .${this.style.editedTagClicky} {
                    cursor: pointer;
                    pointer-events: all;
                }
                .${this.style.editedCompact} {
                    text-indent: 0;
                }

                /* ===== Deleted message media ===== */
                .theme-dark .${this.style.deleted}:not(:hover) img:not(.${this.classes.avatar}), .${this.style.deleted}:not(:hover) .mention, .${this.style.deleted}:not(:hover) .reactions, .${this.style.deleted}:not(:hover) a {
                    filter: grayscale(100%) !important;
                }
                .${this.style.deleted} img:not(.${this.classes.avatar}), .${this.style.deleted} .mention, .${this.style.deleted} .reactions, .${this.style.deleted} a {
                    transition: filter 0.3s !important;
                }

                /* ===== Modal scrollbar ===== */
                #mlf-modal-body::-webkit-scrollbar { width: 8px; }
                #mlf-modal-body::-webkit-scrollbar-track { background: transparent; }
                #mlf-modal-body::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.25); border-radius: 4px; }
                #mlf-modal-body::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.45); }

                /* ===== Tab styles ===== */
                .${this.style.tab} {
                    border-color: transparent;
                    color: rgba(212,175,55,0.5);
                    padding: 0 16px;
                    transition: color 0.2s ease, border-color 0.2s ease, text-shadow 0.2s ease;
                    user-select: none;
                }
                .${this.style.tab}:hover {
                    color: rgba(212,175,55,0.85) !important;
                    text-shadow: 0 0 8px rgba(212,175,55,0.3);
                }
                #sent.${this.style.tab} { display: none; }
                .${this.style.tabSelected} {
                    border-color: #d4af37 !important;
                    color: #d4af37 !important;
                    text-shadow: 0 0 12px rgba(212,175,55,0.4);
                }

                /* ===== Menu ===== */
                .${this.style.menuModalLarge} { width: 960px; }
                #${this.style.menuTabBar} { justify-content: center; gap: 4px; }
                .${this.style.textIndent} { margin-left: 40px; }
                .${this.style.imageRoot} { pointer-events: all; }

                /* ===== Messages area ===== */
                #${this.style.menuMessages} { padding: 16px 20px; }
                #${this.style.menuMessages} > strong {
                  display: block; text-align: center;
                  padding: 60px 20px; opacity: 0.4; font-size: 14px;
                  color: rgba(212,175,55,0.6);
                }

                /* ===== Message group separators ===== */
                #${this.style.menuMessages} > [class*="groupStart"] {
                  margin-top: 12px;
                  padding-top: 12px;
                  border-top: 1px solid rgba(212,175,55,0.08);
                }
                #${this.style.menuMessages} > [class*="groupStart"]:first-child {
                  margin-top: 0; padding-top: 0; border-top: none;
                }

                /* ===== Filter input ===== */
                #${this.style.filter} { opacity: 1; }
                .${this.style.inputWrapper} { display: flex; flex-direction: column; margin-right: 40px; }
                .${this.style.multiInput} {
                  font-size: 14px; box-sizing: border-box; width: 100%;
                  border-radius: 4px; color: #ccc;
                  background-color: rgba(13,10,26,0.6);
                  border: 1px solid rgba(212,175,55,0.15); display: flex; align-items: center;
                }
                .${this.style.multiInputFirst} { flex-grow: 1; }
                .${this.style.input} {
                  font-size: 14px; box-sizing: border-box; width: 100%;
                  border-radius: 4px; color: #ccc;
                  background-color: transparent; border: none;
                  padding: 8px 12px; height: 36px; outline: none;
                }
                .${this.style.input}::placeholder { color: rgba(212,175,55,0.3); }

                /* ===== Help (?) button ===== */
                .${this.style.questionMark} {
                  display: flex; align-items: center; justify-content: center;
                  width: 28px; height: 28px; border-radius: 4px;
                  margin-right: 4px; padding: 0; min-width: 0; min-height: 0;
                  background-color: #d4af37;
                  color: #0d0a1a; cursor: pointer;
                  box-shadow: 0 0 8px rgba(212,175,55,0.3);
                }
                .${this.style.questionMark}:hover { box-shadow: 0 0 14px rgba(212,175,55,0.5); }

                /* ===== Tab bar ===== */
                .${this.style.tabBarContainer} {
                  border-bottom: 1px solid rgba(212,175,55,0.12);
                  padding: 0 20px;
                  margin-bottom: 12px;
                }
                .${this.style.tabBar} { display: flex; height: 44px; align-items: stretch; gap: 4px; }
                .${this.style.tabBarItem} {
                  display: flex; font-size: 14px; padding: 0 14px;
                  border-bottom: 2px solid transparent; align-items: center;
                  cursor: pointer; line-height: 20px; font-weight: 500;
                  flex-shrink: 0; white-space: nowrap;
                  transition: color 0.2s ease, text-shadow 0.2s ease;
                }
                .${this.style.tabBarItem}:hover { color: rgba(212,175,55,0.85); }

                /* ===== Menu root ===== */
                .${this.style.menuRoot} .${this.style.questionMark} { margin-left: 5px; }
                .${this.style.menuRoot} { width: 960px; }
            `
    );
    this.patchMessages();
    this.patchModal();

    // const createKeybindListener = () => {
    //   this.keybindListener = new (ZeresPluginLibrary.WebpackModules.getModule(m => typeof m === 'function' && m.toString().includes('.default.setOnInputEventCallback')))();
    //   this.keybindListener.on('change', e => {
    //     if (this.settings.disableKeybind) return; // todo: destroy if disableKeybind is set to true and don't make one if it was true from the start
    //     // this is the hackiest thing ever but it works xdd
    //     if (!ZeresPluginLibrary.WebpackModules.getByProps('isFocused').isFocused() || document.getElementsByClassName('bda-slist').length) return;
    //     const isKeyBind = keybind => {
    //       if (e.combo.length != keybind.length) return false;
    //       // console.log(e.combo);
    //       for (let i = 0; i < e.combo.length; i++) {
    //         if (e.combo[i][1] != keybind[i]) {
    //           return false;
    //         }
    //       }
    //       return true;
    //     };
    //     const close = () => {
    //       this.menu.filter = '';
    //       this.menu.open = false;
    //       this.ModalStack.closeModal(this.style.menu);
    //     };
    //     if (isKeyBind(this.settings.openLogKeybind)) {
    //       if (this.menu.open) return close();
    //       return this.openWindow();
    //     }
    //     if (isKeyBind(this.settings.openLogFilteredKeybind)) {
    //       if (this.menu.open) return close();
    //       if (!this.selectedChannel) {
    //         this.showToast('No channel selected', { type: 'error' });
    //         return this.openWindow();
    //       }
    //       this.menu.filter = `channel:${this.selectedChannel.id}`;
    //       this.openWindow();
    //     }
    //   });
    // };

    //this.powerMonitor = ZeresPluginLibrary.WebpackModules.getByProps('remotePowerMonitor').remotePowerMonitor;

    // const refreshKeykindListener = () => {
    //   this.keybindListener.destroy();
    //   createKeybindListener();
    // };

    //this.keybindListenerInterval = setInterval(refreshKeykindListener, 30 * 1000 * 60); // 10 minutes

    //createKeybindListener();

    // this.powerMonitor.on(
    //   'resume',
    //   (this.powerMonitorResumeListener = () => {
    //     setTimeout(refreshKeykindListener, 1000);
    //   })
    // );
    /*
        this.unpatches.push(
          this.Patcher.instead(ZeresPluginLibrary.WebpackModules.getByDisplayName('TextAreaAutosize').prototype, 'focus', (thisObj, args, original) => {
            if (this.menu.open) return;
            return original(...args);
          })
        );

        this.unpatches.push(
          this.Patcher.instead(ZeresPluginLibrary.WebpackModules.getByDisplayName('LazyImage').prototype, 'getSrc', (thisObj, args, original) => {
            let indx;
            if (thisObj && thisObj.props && thisObj.props.src && ((indx = thisObj.props.src.indexOf('?ML=true')), indx !== -1)) return thisObj.props.src.substr(0, indx);
            return original(...args);
          })
        ); */

    this.dataManagerInterval = setInterval(() => {
      this.handleMessagesCap();
    }, 60 * 1000 * 5); // every 5 minutes, no need to spam it, could be intensive

    this.ContextMenuActions = ZeresPluginLibrary.DiscordModules.ContextMenuActions;

    this.menu.randomValidChannel = (() => {
      const channels = this.ChannelStore.getChannels ? this.ChannelStore.getChannels() : ZeresPluginLibrary.WebpackModules.getByProps('getChannels').getChannels();
      var keys = Object.keys(channels);
      return channels[keys[(keys.length * Math.random()) << 0]];
    })();

    this.menu.userRequestQueue = [];

    this.menu.deleteKeyDown = false;
    document.addEventListener(
      'keydown',
      (this.keydownListener = e => {
        if (e.repeat) return;
        if (e.keyCode === 46) this.menu.deleteKeyDown = true;
      })
    );
    document.addEventListener(
      'keyup',
      (this.keyupListener = e => {
        if (e.repeat) return;
        if (e.keyCode === 46) this.menu.deleteKeyDown = false;
      })
    );

    this.menu.shownMessages = -1;
    const iconShit = ZeresPluginLibrary.WebpackModules.getByProps('container', 'children', 'toolbar', 'iconWrapper');
    // Icon by font awesome
    // https://fontawesome.com/license
    this.channelLogButton = this.parseHTML(`<div tabindex="0" class="${iconShit.iconWrapper} ${iconShit.clickable}" role="button">
                                                        <svg aria-hidden="true" class="${iconShit.icon}" name="Open Logs" viewBox="0 0 576 512">
                                                            <path fill="currentColor" d="M218.17 424.14c-2.95-5.92-8.09-6.52-10.17-6.52s-7.22.59-10.02 6.19l-7.67 15.34c-6.37 12.78-25.03 11.37-29.48-2.09L144 386.59l-10.61 31.88c-5.89 17.66-22.38 29.53-41 29.53H80c-8.84 0-16-7.16-16-16s7.16-16 16-16h12.39c4.83 0 9.11-3.08 10.64-7.66l18.19-54.64c3.3-9.81 12.44-16.41 22.78-16.41s19.48 6.59 22.77 16.41l13.88 41.64c19.75-16.19 54.06-9.7 66 14.16 1.89 3.78 5.49 5.95 9.36 6.26v-82.12l128-127.09V160H248c-13.2 0-24-10.8-24-24V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24v-40l-128-.11c-16.12-.31-30.58-9.28-37.83-23.75zM384 121.9c0-6.3-2.5-12.4-7-16.9L279.1 7c-4.5-4.5-10.6-7-17-7H256v128h128v-6.1zm-96 225.06V416h68.99l161.68-162.78-67.88-67.88L288 346.96zm280.54-179.63l-31.87-31.87c-9.94-9.94-26.07-9.94-36.01 0l-27.25 27.25 67.88 67.88 27.25-27.25c9.95-9.94 9.95-26.07 0-36.01z"/>
                                                        </svg>
                                                    </div>`);
    this.channelLogButton.addEventListener('click', () => {
      this.openWindow();
    });
    this.channelLogButton.addEventListener('contextmenu', () => {
      if (!this.selectedChannel) return;
      this.menu.filter = `channel:${this.selectedChannel.id}`;
      this.openWindow();
    });
    new ZeresPluginLibrary.Tooltip(this.channelLogButton, '𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌', { side: 'bottom' });

    if (this.settings.showOpenLogsButton) setTimeout(() => this.addOpenLogsButton(), 1000); // I hate this.. buuut it works, at this point idk what order things are executing..

    this.unpatches.push(
      this.Patcher.instead(ZeresPluginLibrary.DiscordModules.MessageActions, 'deleteMessage', (_, args, original) => {
        const messageId = args[1];
        if (this.messageRecord[messageId] && this.messageRecord[messageId].delete_data) return;
        this.localDeletes.push(messageId);
        if (this.localDeletes.length > 10) this.localDeletes.shift();
        return original(...args);
      })
    );

    this.unpatches.push(
      this.Patcher.instead(this.messageStore, 'getLastEditableMessage', (_this, [channelId]) => {
        const me = XenoLib.DiscordAPI.userId;
        return _this
          .getMessages(channelId)
          .toArray()
          .reverse()
          .find(iMessage => iMessage.author.id === me && iMessage.state === 'SENT' && (!this.messageRecord[iMessage.id] || !this.messageRecord[iMessage.id].delete_data));
      })
    );
    this.patchContextMenus();

    if (!(this.settings.flags & Flags.STARTUP_HELP)) {
      this.settings.flags |= Flags.STARTUP_HELP;
      this.showLoggerHelpModal(true);
      this.saveSettings();
    }

    this.selfTestInterval = setInterval(() => {
      this.selfTestTimeout = setTimeout(() => {
        if (this.selfTestFailures > 4) {
          clearInterval(this.selfTestInterval);
          this.selfTestInterval = 0;
          return BdApi.alert(`${this.getName()}: internal error.`, `Self test failure: Failed to hook dispatch. Recommended to reload your discord (CTRL + R) as the plugin may be in a broken state! If you still see this error, open up the devtools console (CTRL + SHIFT + I, click console tab) and report the errors to ${this.getAuthor()} for further assistance.`);
        }
        ZeresPluginLibrary.Logger.warn(this.getName(), 'Dispatch is not hooked, all our hooks may be invalid, attempting to reload self');
        this.selfTestFailures++;
        this.stop();
        this.start();
      }, 3000);
      this.dispatcher.dispatch({
        type: 'MESSAGE_LOG_SELF_TEST'
      });
    }, 10000);

    if (this.selfTestInited) return;
    this.selfTestFailures = 0;
    this.selfTestInited = true;
  }
  shutdown() {
    if (!global.ZeresPluginLibrary) return;
    this.__started = false;
    const tryUnpatch = fn => {
      if (typeof fn !== 'function') return;
      try {
        // things can bug out, best to reload tbh, should maybe warn the user?
        fn();
      } catch (e) {
        ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Error unpatching', e);
      }
    };
    if (Array.isArray(this.unpatches)) for (let unpatch of this.unpatches) tryUnpatch(unpatch);
    ZeresPluginLibrary.Patcher.unpatchAll(this.getName());
    if (this.MessageContextMenuPatch) tryUnpatch(this.MessageContextMenuPatch);
    if (this.ChannelContextMenuPatch) tryUnpatch(this.ChannelContextMenuPatch);
    if (this.GuildContextMenuPatch) tryUnpatch(this.GuildContextMenuPatch);
    try {
      this.Patcher.unpatchAll();
    } catch (e) { }
    this.forceReloadMessages();
    // if (this.keybindListener) this.keybindListener.destroy();
    if (this.style && this.style.css) ZeresPluginLibrary.PluginUtilities.removeStyle(this.style.css);
    if (this.dataManagerInterval) clearInterval(this.dataManagerInterval);
    // if (this.keybindListenerInterval) clearInterval(this.keybindListenerInterval);
    if (this.selfTestInterval) clearInterval(this.selfTestInterval);
    if (this.selfTestTimeout) clearTimeout(this.selfTestTimeout);
    if (this._autoUpdateInterval) clearInterval(this._autoUpdateInterval);
    if (this.keydownListener) document.removeEventListener('keydown', this.keydownListener);
    if (this.keyupListener) document.removeEventListener('keyup', this.keyupListener);
    // if (this.powerMonitor) this.powerMonitor.removeListener('resume', this.powerMonitorResumeListener);
    if (this.channelLogButton) this.channelLogButton.remove();
    if (this._imageCacheServer) this._imageCacheServer.stop();
    if (typeof this._modalsApiUnsubcribe === 'function')
      try {
        this._modalsApiUnsubcribe();
      } catch { }
    // console.log('invalidating cache');
    this.invalidateAllChannelCache();
    //  if (this.selectedChannel) this.cacheChannelMessages(this.selectedChannel.id); // bad idea?
  }
  automaticallyUpdate() {
    const updateFail = () => XenoLib.Notifications.warning(`[${this.getName()}] Unable to check for updates!`, { timeout: 7500 });
    fetch('https://raw.githubusercontent.com/missspelll/messageloggerfix/main/messageloggerfix.plugin.js', { headers: { 'origin': 'discord.com' } })
      .then(res => {
        if (!res.ok) { updateFail(); return; }
        return res.text();
      })
      .then(body => {
        if (!body) return;
        if (!XenoLib.versionComparator(this.getVersion(), XenoLib.extractVersion(body))) return;
        const fs = require('fs');
        const _path = require('path');
        const theActualFileName = _path.join(__dirname, _path.basename(__filename));
        fs.writeFileSync(theActualFileName, body);
        XenoLib.Notifications.success(`[${this.getName()}] Successfully updated!`, { timeout: 0 });
        BdApi.Plugins.reload(this.getName());
      })
      .catch(() => updateFail());
  }
  // title-3qD0b- da-title container-1r6BKw da-container themed-ANHk51 da-themed
  // chatContent-a9vAAp da-chatContent
  observer({ addedNodes }) {
    let isChat = false;
    let isTitle = false;
    for (const change of addedNodes) {
      //  || (isChat = typeof change.className === 'string' && change.className.indexOf(this.observer.chatContentClass) !== -1) || (isTitle = typeof change.className === 'string' && change.className.indexOf(this.observer.titleClass) !== -1) || (change.style && change.style.cssText === 'border-radius: 2px; background-color: rgba(114, 137, 218, 0);') || (typeof change.className === 'string' && change.className.indexOf(this.observer.containerCozyClass) !== -1)
      if (
        // check if we went from non chat to chat
        (isTitle = isChat = (change.classList?.contains(this.observer.chatClass) || change.firstElementChild?.classList?.contains(this.observer.chatClass)))
        ||
        (isChat = (change.classList?.contains(this.observer.chatContentClass)))
        ||
        (isTitle = (change.classList?.contains(this.observer.titleClass)))
      ) {
        try {
          if (isChat) {
            this.selectedChannel = this.getSelectedTextChannel();
            this.noTintIds = [];
            this.editModifiers = {};
          }
          if (!this.selectedChannel) return ZeresPluginLibrary.Logger.warn(this.getName(), 'Chat was loaded but no text channel is selected');
          if (isTitle && this.settings.showOpenLogsButton) {
            let srch = change.querySelector('div[class*="-search"]') || change.querySelector('div[class*="search_"]');
            if (!srch) return ZeresPluginLibrary.Logger.warn(this.getName(), 'Observer caught title loading, but no search bar was found! Open Logs button will not show!');
            if (this.channelLogButton && srch.parentElement) {
              srch.parentElement.insertBefore(this.channelLogButton, srch); // memory leak..?
            }
            srch = null;
            if (!isChat) return;
          }
          const showStuff = (map, name) => {
            if (map[this.selectedChannel.id] && map[this.selectedChannel.id]) {
              if (this.settings.useNotificationsInstead) {
                XenoLib.Notifications.info(`There are ${map[this.selectedChannel.id]} new ${name} messages in ${this.selectedChannel.name && this.selectedChannel.type !== 3 ? '<#' + this.selectedChannel.id + '>' : 'DMs'}`, { timeout: 3000 });
              } else {
                this.showToast(`There are ${map[this.selectedChannel.id]} new ${name} messages in ${this.selectedChannel.name ? '#' + this.selectedChannel.name : 'DMs'}`, {
                  type: 'info',
                  onClick: () => this.openWindow(name),
                  timeout: 3000
                });
              }
              map[this.selectedChannel.id] = 0;
            }
          };
          if (this.settings.showDeletedCount) showStuff(this.deletedChatMessagesCount, 'deleted');
          if (this.settings.showEditedCount) showStuff(this.editedChatMessagesCount, 'edited');
        } catch (e) {
          ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Error in observer', e);
        }
        break;
      }
    }
  }
  buildSetting(data) {
    const { id } = data;
    const setting = XenoLib.buildSetting(data);
    if (id) setting.getElement().id = this.obfuscatedClass(id);
    return setting;
  }
  createSetting(data) {
    const current = Object.assign({}, data);
    if (!current.onChange) {
      current.onChange = value => {
        this.settings[current.id] = value;
        if (current.callback) current.callback(value);
      };
    }
    if (typeof current.value === 'undefined') current.value = this.settings[current.id];
    return this.buildSetting(current);
  }
  createGroup(group) {
    const { name, id, collapsible, shown, settings } = group;

    const list = [];
    for (let s = 0; s < settings.length; s++) list.push(this.createSetting(settings[s]));

    const settingGroup = new ZeresPluginLibrary.Settings.SettingGroup(name, { shown, collapsible }).append(...list);
    settingGroup.group.id = id; // should generate the id in here instead?
    return settingGroup;
  }
  getSettingsPanel() {
    // todo, sort out the menu
    const list = [];
    // list.push(
    //   this.createGroup({
    //     name: 'Keybinds',
    //     id: this.obfuscatedClass('ml2-settings-keybinds'),
    //     collapsible: true,
    //     shown: false,
    //     settings: [
    //       {
    //         name: 'Open menu keybind',
    //         id: 'openLogKeybind',
    //         type: 'keybind'
    //       },
    //       {
    //         name: 'Open log filtered by selected channel',
    //         id: 'openLogFilteredKeybind',
    //         type: 'keybind'
    //       },
    //       {
    //         name: 'Disable keybinds',
    //         id: 'disableKeybind',
    //         type: 'switch'
    //       }
    //     ]
    //   })
    // );
    list.push(
      this.createGroup({
        name: 'Ignores and overrides',
        id: this.obfuscatedClass('ml2-settings-ignores-overrides'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Ignore muted servers',
            id: 'ignoreMutedGuilds',
            type: 'switch'
          },
          {
            name: 'Ignore muted channels',
            id: 'ignoreMutedChannels',
            type: 'switch'
          },
          {
            name: 'Ignore bots',
            id: 'ignoreBots',
            type: 'switch'
          },
          {
            name: 'Ignore messages posted by you',
            id: 'ignoreSelf',
            type: 'switch'
          },
          {
            name: 'Ignore message edits from you',
            id: 'ignoreLocalEdits',
            type: 'switch'
          },
          {
            name: 'Ignore message deletes from you',
            note: 'Only ignores if you delete your own message.',
            id: 'ignoreLocalDeletes',
            type: 'switch'
          },
          {
            name: 'Ignore blocked users',
            id: 'ignoreBlockedUsers',
            type: 'switch'
          },
          {
            name: 'Ignore NSFW channels',
            id: 'ignoreNSFW',
            type: 'switch'
          },
          {
            name: 'Only log whitelist',
            id: 'onlyLogWhitelist',
            type: 'switch'
          },
          {
            name: 'Always log selected channel, regardless of whitelist/blacklist',
            id: 'alwaysLogSelected',
            type: 'switch'
          },
          {
            name: 'Always log DMs, regardless of whitelist/blacklist',
            id: 'alwaysLogDM',
            type: 'switch'
          },
          {
            name: 'Always log ghost pings, regardless of whitelist/blacklist',
            note: 'Messages sent in ignored/muted/blacklisted servers and channels will be logged and shown in sent, but only gets saved if a ghost ping occurs.',
            id: 'alwaysLogGhostPings',
            type: 'switch'
          }
        ]
      })
    );
    list.push(
      this.createGroup({
        name: 'Display settings',
        id: this.obfuscatedClass('ml2-settings-display'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Display dates with timestamps',
            id: 'displayDates',
            type: 'switch',
            callback: () => {
              if (this.selectedChannel) {
                // change NOW
                this.invalidateAllChannelCache();
                this.cacheChannelMessages(this.selectedChannel.id);
              }
            }
          },
          {
            name: 'Display deleted messages in chat',
            id: 'showDeletedMessages',
            type: 'switch',
            callback: () => {
              this.invalidateAllChannelCache();
              if (this.selectedChannel) this.cacheChannelMessages(this.selectedChannel.id);
            }
          },
          {
            name: 'Display edited messages in chat',
            id: 'showEditedMessages',
            type: 'switch',
            callback: () => this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT' })
          },
          {
            name: 'Max number of shown edits',
            id: 'maxShownEdits',
            type: 'textbox',
            onChange: val => {
              if (isNaN(val)) return this.showToast('Value must be a number!', { type: 'error' });
              this.settings.maxShownEdits = parseInt(val);
              this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT' });
            }
          },
          {
            name: 'Show oldest edit instead of newest if over the shown edits limit',
            id: 'hideNewerEditsFirst',
            type: 'switch',
            callback: () => this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT' })
          },
          {
            name: 'Use red background instead of red text for deleted messages',
            id: 'useAlternativeDeletedStyle',
            type: 'switch',
            callback: () => this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE' })
          },
          {
            name: 'Display purged messages in chat',
            id: 'showPurgedMessages',
            type: 'switch',
            callback: () => {
              this.invalidateAllChannelCache();
              if (this.selectedChannel) this.cacheChannelMessages(this.selectedChannel.id);
            }
          },
          {
            name: 'Restore deleted messages after reload',
            id: 'restoreDeletedMessages',
            type: 'switch',
            callback: val => {
              if (val) {
                this.invalidateAllChannelCache();
                if (this.selectedChannel) this.cacheChannelMessages(this.selectedChannel.id);
              }
            }
          },
          {
            name: 'Show amount of new deleted messages when entering a channel',
            id: 'showDeletedCount',
            type: 'switch'
          },
          {
            name: 'Show amount of new edited messages when entering a channel',
            id: 'showEditedCount',
            type: 'switch'
          },
          {
            name: 'Display update notes',
            id: 'displayUpdateNotes',
            type: 'switch'
          },
          {
            name: 'Menu sort direction',
            id: 'reverseOrder',
            type: 'radio',
            options: [
              {
                name: 'New - old',
                value: false
              },
              {
                name: 'Old - new',
                value: true
              }
            ]
          },
          {
            name: 'Use XenoLib notifications instead of toasts',
            note: "This works for edit, send, delete and purge toasts, as well as delete and edit count toasts. Toggle it if you don't know what this does.",
            id: 'useNotificationsInstead',
            type: 'switch',
            callback: e => (e ? XenoLib.Notifications.success('Using Xenolib notifications', { timeout: 5000 }) : this.showToast('Using toasts', { type: 'success', timeout: 5000 }))
          }
        ]
      })
    );
    list.push(
      this.createGroup({
        name: 'Misc settings',
        id: this.obfuscatedClass('ml2-settings-misc'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Disable saving data. Logged messages are erased after reload/restart. Disables auto backup.',
            id: 'dontSaveData',
            type: 'switch',
            callback: val => {
              if (!val) this.saveData();
              if (!val && this.settings.autoBackup) this.saveBackup();
            }
          },
          {
            name: "Auto backup data (won't fully prevent losing data, just prevent total data loss)",
            id: 'autoBackup',
            type: 'switch',
            callback: val => {
              if (val && !this.settings.dontSaveData) this.saveBackup();
            }
          } /*
                        {
                            // no time, TODO!
                            name: 'Deleted messages color',
                            id: 'deletedMessageColor',
                            type: 'color'
                        }, */,
          {
            name: 'Aggresive message caching (makes sure we have the data of any deleted or edited messages)',
            id: 'aggresiveMessageCaching',
            type: 'switch'
          },
          {
            name: 'Cache all images by storing them locally in the ML_IMAGE_CACHE folder inside the plugins folder',
            id: 'cacheAllImages',
            type: 'switch'
          },
          {
            name: "Don't delete cached images",
            note: "If the message the image is from is erased from data, the cached image will be kept. You'll have to monitor disk usage on your own!",
            id: 'dontDeleteCachedImages',
            type: 'switch'
          },
          {
            name: 'Display open logs button next to the search box top right in channels',
            id: 'showOpenLogsButton',
            type: 'switch',
            callback: val => {
              if (val) return this.addOpenLogsButton();
              this.removeOpenLogsButton();
            }
          },
          {
            name: 'Block spam edit notifications (if enabled)',
            id: 'blockSpamEdit',
            type: 'switch'
          }
        ]
      })
    );
    list.push(
      this.createGroup({
        name: 'Toast notifications for guilds',
        id: this.obfuscatedClass('ml2-settings-toast-guilds'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Message sent',
            id: 'sent',
            type: 'switch',
            value: this.settings.toastToggles.sent,
            onChange: val => {
              this.settings.toastToggles.sent = val;
            }
          },
          {
            name: 'Message edited',
            id: 'edited',
            type: 'switch',
            value: this.settings.toastToggles.edited,
            onChange: val => {
              this.settings.toastToggles.edited = val;
            }
          },
          {
            name: 'Message deleted',
            id: 'deleted',
            type: 'switch',
            value: this.settings.toastToggles.deleted,
            onChange: val => {
              this.settings.toastToggles.deleted = val;
            }
          },
          {
            name: 'Ghost pings',
            id: 'ghostPings',
            type: 'switch',
            value: this.settings.toastToggles.ghostPings,
            onChange: val => {
              this.settings.toastToggles.ghostPings = val;
            }
          },
          {
            name: 'Disable toasts for local user (yourself)',
            id: 'disableToastsForLocal',
            type: 'switch',
            value: this.settings.toastToggles.disableToastsForLocal,
            onChange: val => {
              this.settings.toastToggles.disableToastsForLocal = val;
            }
          }
        ]
      })
    );

    list.push(
      this.createGroup({
        name: 'Toast notifications for DMs',
        id: this.obfuscatedClass('ml2-settings-toast-dms'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Message sent',
            id: 'sent',
            type: 'switch',
            value: this.settings.toastTogglesDMs.sent,
            onChange: val => {
              this.settings.toastTogglesDMs.sent = val;
            }
          },
          {
            name: 'Message edited',
            id: 'edited',
            type: 'switch',
            value: this.settings.toastTogglesDMs.edited,
            onChange: val => {
              this.settings.toastTogglesDMs.edited = val;
            }
          },
          {
            name: 'Message deleted',
            id: 'deleted',
            type: 'switch',
            value: this.settings.toastTogglesDMs.deleted,
            onChange: val => {
              this.settings.toastTogglesDMs.deleted = val;
            }
          },
          {
            name: 'Ghost pings',
            id: 'ghostPings',
            type: 'switch',
            value: this.settings.toastTogglesDMs.ghostPings,
            onChange: val => {
              this.settings.toastTogglesDMs.ghostPings = val;
            }
          }
        ]
      })
    );

    list.push(
      this.createGroup({
        name: 'Message caps',
        id: this.obfuscatedClass('ml2-settings-caps'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Cached messages cap',
            note: 'Max number of sent messages messageloggerfix should keep track of',
            id: 'messageCacheCap',
            type: 'textbox',
            onChange: val => {
              if (isNaN(val)) return this.showToast('Value must be a number!', { type: 'error' });
              this.settings.messageCacheCap = parseInt(val);
              clearInterval(this.dataManagerInterval);
              this.dataManagerInterval = setInterval(() => {
                this.handleMessagesCap();
              }, 60 * 1000 * 5);
            }
          },
          {
            name: 'Saved messages cap',
            note: "Max number of messages saved to disk, this limit is for deleted, edited and purged INDIVIDUALLY. So if you have it set to 1000, it'll be 1000 edits, 1000 deletes and 1000 purged messages max",
            id: 'savedMessagesCap',
            type: 'textbox',
            onChange: val => {
              if (isNaN(val)) return this.showToast('Value must be a number!', { type: 'error' });
              this.settings.savedMessagesCap = parseInt(val);
              clearInterval(this.dataManagerInterval);
              this.dataManagerInterval = setInterval(() => {
                this.handleMessagesCap();
              }, 60 * 1000 * 5);
            }
          },
          {
            name: 'Menu message render cap',
            note: 'How many messages will show before the LOAD MORE button will show',
            id: 'renderCap',
            type: 'textbox',
            onChange: val => {
              if (isNaN(val)) return this.showToast('Value must be a number!', { type: 'error' });
              this.settings.renderCap = parseInt(val);
              clearInterval(this.dataManagerInterval);
            }
          }
        ]
      })
    );

    list.push(
      this.createGroup({
        name: 'Advanced',
        id: this.obfuscatedClass('ml2-settings-advanced'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Obfuscate CSS classes',
            note: 'Enable this if some plugin, library or theme is blocking you from using the plugin',
            id: 'obfuscateCSSClasses',
            type: 'switch'
          },
          {
            name: 'Automatic updates',
            note: "Do NOT disable unless you really don't want automatic updates",
            id: 'autoUpdate',
            type: 'switch',
            callback: val => {
              if (val) {
                this._autoUpdateInterval = setInterval(_ => this.automaticallyUpdate(), 1000 * 60 * 15); // 15 minutes
                this.automaticallyUpdate();
              } else {
                clearInterval(this._autoUpdateInterval);
                try {
                  ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), 'https://raw.githubusercontent.com/missspelll/messageloggerfix/main/messageloggerfix.plugin.js');
                } catch (err) { }
              }
            }
          },
          {
            name: 'Contextmenu submenu name',
            note: "Instead of saying MessageLoggerFix, make it say something else, so it's screenshot friendly",
            id: 'contextmenuSubmenuName',
            type: 'textbox'
          } /* ,
          {
            name: 'Image cache directory',
            note: 'Press enter to save the path',
            id: 'imageCacheDir',
            type: 'path',
            onChange: val => {
              console.log(this.settings.imageCacheDir, val, 'what?');
              if (this.settings.imageCacheDir === val) return;
              const savedImages = this.nodeModules.fs.readdirSync(this.settings.imageCacheDir);
              console.log(savedImages);
              if (!savedImages.length) return;
              https://stackoverflow.com/questions/10420352/
              function humanFileSize(bytes, si) {
                const thresh = si ? 1000 : 1024;
                if (Math.abs(bytes) < thresh) return `${bytes} B`;
                const units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
                let u = -1;
                do {
                  bytes /= thresh;
                  ++u;
                } while (Math.abs(bytes) >= thresh && u < units.length - 1);
                return `${bytes.toFixed(1)}${units[u]}`;
              }
              let sz = 0;
              for (let image of savedImages) ;
              const size = humanFileSize(this.nodeModules.fs.statSync(this.settings.imageCacheDir).size);
              ZeresPluginLibrary.Modals.showModal('Move images', React.createElement(ZeresPluginLibrary.DiscordModules.TextElement.default, { color: ZeresPluginLibrary.DiscordModules.TextElement.Colors.PRIMARY, children: [`Would you like to move ${savedImages.length} images from the old folder to the new? Size of all images is ${size}.`] }), {
                confirmText: 'Yes',
                onConfirm: () => {}
              });
              //this.settings.imageCacheDir = val;
            }
          } */
        ]
      })
    );

    const div = document.createElement('div');
    div.id = this.obfuscatedClass('ml2-settings-buttonbox');
    div.style.display = 'inline-flex';
    div.appendChild(this.createButton('Changelog', () => XenoLib.showChangelog(`${this.getName()} has been updated!`, this.getVersion(), this.getChanges())));
    div.appendChild(this.createButton('Stats', () => this.showStatsModal()));
    div.appendChild(
      this.createButton('GitHub', () => window.open('https://github.com/missspelll/messageloggerfix'))
    );
    div.appendChild(this.createButton('Help', () => this.showLoggerHelpModal()));
    let button = div.firstElementChild;
    while (button) {
      button.style.marginRight = button.style.marginLeft = `5px`;
      button = button.nextElementSibling;
    }

    list.push(div);

    return ZeresPluginLibrary.Settings.SettingPanel.build(_ => this.saveSettings(), ...list);
  }
  /* ==================================================-|| START HELPERS ||-================================================== */
  saveSettings() {
    try {
      ZeresPluginLibrary.PluginUtilities.saveSettings(this.getName(), this.settings);
    } catch(e) {
      console.error('[messageloggerfix] saveSettings failed, using fallback', e);
      try {
        BdApi.Data.save(this.getName(), 'settings', this.settings);
      } catch(e2) {
        console.error('[messageloggerfix] fallback save also failed', e2);
      }
    }
  }
  handleDataSaving() {
    // saveData/setPluginData is synchronous, can get slow with bigger files
    if (!this.handleDataSaving.errorPageClass) this.handleDataSaving.errorPageClass = '.' + XenoLib.getClass('errorPage');
    /* refuse saving on error page */
    if (!this.messageRecord || document.querySelector(this.handleDataSaving.errorPageClass)) return; /* did we crash? */
    if (!Object.keys(this.messageRecord).length) {
      try { this.nodeModules.fs.unlinkSync(this.nodeModules.path.join(this.dataDir, this.getName() + 'Data.config.json')); } catch(e) {}
      return;
    }
    const callback = err => {
      if (err) {
        XenoLib.Notifications.error('There has been an error saving the data file');
        ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'There has been an error saving the data file', err);
      }
      if (this.settings.autoBackup) {
        if (this.saveBackupTimeout) this.autoBackupSaveInterupts++;
        if (this.autoBackupSaveInterupts < 4) {
          if (this.saveBackupTimeout) clearTimeout(this.saveBackupTimeout);
          // 20 seconds after, in case shits going down y'know, better not to spam save and corrupt it, don't become the thing you're trying to eliminate
          this.saveBackupTimeout = setTimeout(() => this.saveBackup(), 20 * 1000);
        }
      }
      this.requestedDataSave = 0;
    };
    const useEfficient = !window.ED;
    if (useEfficient) {
      this.efficientlySaveData(
        this.getName() + 'Data',
        'data',
        {
          messageRecord: this.messageRecord,
          deletedMessageRecord: this.deletedMessageRecord,
          editedMessageRecord: this.editedMessageRecord,
          purgedMessageRecord: this.purgedMessageRecord
        },
        callback
      );
    } else {
      ZeresPluginLibrary.PluginUtilities.saveData(this.getName() + 'Data', 'data', {
        messageRecord: this.messageRecord,
        deletedMessageRecord: this.deletedMessageRecord,
        editedMessageRecord: this.editedMessageRecord,
        purgedMessageRecord: this.purgedMessageRecord
      });
      callback();
    }
  }
  saveData() {
    if (!this.settings.dontSaveData && !this.requestedDataSave) this.requestedDataSave = setTimeout(() => this.handleDataSaving(), 1000); // needs to be async
  }
  efficientlySaveData(name, key, data, callback) {
    try {
      let loadedData;
      try {
        /* bd gay bruh */
        loadedData = BdApi.Data.load(name, key);
      } catch (err) { }
      if (loadedData) for (const key in data) loadedData[key] = data[key];
      this.nodeModules.fs.writeFile(this.nodeModules.path.join(this.dataDir, `${name}.config.json`), JSON.stringify({ [key]: data }), callback);
    } catch (e) {
      XenoLib.Notifications.error('There has been an error saving the data file');
      ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'There has been an error saving the data file', e);
    }
  }
  saveBackup() {
    const callback = err => {
      if (err) {
        XenoLib.Notifications.error('There has been an error saving the data file');
        ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'There has been an error saving the data file', err);
      }
      this.saveBackupTimeout = 0;
      this.autoBackupSaveInterupts = 0;
      // verify backup was written
      try {
        const bp = this.nodeModules.path.join(this.dataDir, this.getName() + 'DataBackup.config.json');
        const bd = JSON.parse(this.nodeModules.fs.readFileSync(bp, 'utf8'));
        if (!bd.data || !bd.data.messageRecord) this.saveBackupTimeout = setTimeout(() => this.saveBackup, 300);
      } catch(e) { this.saveBackupTimeout = setTimeout(() => this.saveBackup, 300); }
    };
    const useEfficient = !window.ED;
    if (useEfficient) {
      this.efficientlySaveData(
        this.getName() + 'DataBackup',
        'data',
        {
          messageRecord: this.messageRecord,
          deletedMessageRecord: this.deletedMessageRecord,
          editedMessageRecord: this.editedMessageRecord,
          purgedMessageRecord: this.purgedMessageRecord
        },
        callback
      );
    } else {
      ZeresPluginLibrary.PluginUtilities.saveData(this.getName() + 'DataBackup', 'data', {
        messageRecord: this.messageRecord,
        deletedMessageRecord: this.deletedMessageRecord,
        editedMessageRecord: this.editedMessageRecord,
        purgedMessageRecord: this.purgedMessageRecord
      });
      callback();
    }
  }
  parseHTML(html) {
    // TODO: drop this func, it's 75% slower than just making the elements manually
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }
  randomString() {
    let start = rand();
    while (start[0].toUpperCase() == start[0].toLowerCase()) start = rand();
    return start + '-' + rand();
    function rand() {
      return Math.random().toString(36).substr(2, 7);
    }
  }
  obfuscatedClass(selector) {
    if (!this.obfuscatedClass.obfuscations) this.obfuscatedClass.obfuscations = {};
    if (this.settings.obfuscateCSSClasses) {
      const { obfuscations } = this.obfuscatedClass;
      return obfuscations[selector] || (obfuscations[selector] = this.randomString());
    }
    return selector;
  }
  createTimeStamp(from = undefined, forcedDate = false) {
    // todo: timestamp for edited tooltip
    let date;
    if (from) date = new Date(from);
    else date = new Date();
    return (this.settings.displayDates || forcedDate) && forcedDate !== -1 ? `${date.toLocaleTimeString()}, ${date.toLocaleDateString()}` : forcedDate !== -1 ? date.toLocaleTimeString() : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  getCachedMessage(id, channelId = 0) {
    let cached = this.cachedMessageRecord.find(m => m.id == id);
    if (cached) return cached;
    if (channelId) return this.tools.getMessage(channelId, id); // if the message isn't cached, it returns undefined
    return null;
  }
  getEditedMessage(messageId, channelId) {
    if (this.editedMessageRecord[channelId] && this.editedMessageRecord[channelId].findIndex(m => m === messageId) != -1) {
      return this.messageRecord[messageId];
    }
    return null;
  }
  getSavedMessage(id) {
    /* DEPRECATED */
    return this.messageRecord[id];
  }
  cleanupUserObject(user) {
    /* backported from message-log rewrite */
    return {
      discriminator: user.discriminator,
      username: user.username,
      avatar: user.avatar,
      id: user.id,
      bot: user.bot,
      public_flags: typeof user.publicFlags !== 'undefined' ? user.publicFlags : user.public_flags
    };
  }
  cleanupMessageObject(message) {
    const ret = {
      mention_everyone: typeof message.mention_everyone !== 'boolean' ? typeof message.mentionEveryone !== 'boolean' ? false : message.mentionEveryone : message.mention_everyone,
      edited_timestamp: message.edited_timestamp || message.editedTimestamp && new Date(message.editedTimestamp).getTime() || null,
      attachments: message.attachments || [],
      channel_id: message.channel_id,
      reactions: (message.reactions || []).map(e => (!e.emoji.animated && delete e.emoji.animated, !e.me && delete e.me, e)),
      guild_id: message.guild_id || (this.ChannelStore.getChannel(message.channel_id) ? this.ChannelStore.getChannel(message.channel_id).guild_id : undefined),
      content: message.content,
      type: message.type,
      embeds: message.embeds || [],
      author: this.cleanupUserObject(message.author),
      mentions: (message.mentions || []).map(e => (typeof e === 'string' ? this.UserStore.getUser(e) ? this.cleanupUserObject(this.UserStore.getUser(e)) : e : this.cleanupUserObject(e))),
      mention_roles: message.mention_roles || message.mentionRoles || [],
      id: message.id,
      flags: message.flags,
      timestamp: new Date(message.timestamp).getTime(),
      referenced_message: null
    };
    if (ret.type === 19) {
      ret.message_reference = message.message_reference || message.messageReference;
      if (ret.message_reference) {
        if (message.referenced_message) {
          ret.referenced_message = this.cleanupMessageObject(message.referenced_message);
        } else if (this.messageStore.getMessage(ret.message_reference.channel_id, ret.message_reference.message_id)) {
          ret.referenced_message = this.cleanupMessageObject(this.messageStore.getMessage(ret.message_reference.channel_id, ret.message_reference.message_id));
        }
      }
    }
    this.fixEmbeds(ret);
    return ret;
  }
  createMiniFormattedData(message) {
    message = XenoLib.DiscordUtils.cloneDeep(message);
    const obj = {
      message: this.cleanupMessageObject(message), // works!
      local_mentioned: this.tools.isMentioned(message, this.localUser.id),
      /* ghost_pinged: false, */
      delete_data: null /*  {
                    time: integer,
                    hidden: bool
                } */,
      edit_history: null /* [
                    {
                        content: string,
                        timestamp: string
                    }
                ],
                edits_hidden: bool */
    };
    return obj;
  }
  getSelectedTextChannel() {
    return this.ChannelStore.getChannel(ZeresPluginLibrary.DiscordModules.SelectedChannelStore.getChannelId());
  }
  invalidateAllChannelCache() {
    for (let channelId in this.channelMessages) this.invalidateChannelCache(channelId);
  }
  invalidateChannelCache(channelId) {
    if (!this.channelMessages[channelId]) return;
    this.channelMessages[channelId].ready = false;
  }
  cacheChannelMessages(id, relative) {
    // TODO figure out if I can use this to get messages at a certain point
    this.tools.fetchMessages({ channelId: id, limit: 50, jump: (relative && { messageId: relative, ML: true }) || undefined });
  }
  /* UNUSED */
  cachenChannelMessagesRelative(channelId, messageId) {
    ZeresPluginLibrary.DiscordModules.APIModule.get({
      url: ZeresPluginLibrary.DiscordModules.DiscordConstants.Endpoints.MESSAGES(channelId),
      query: {
        before: null,
        after: null,
        limit: 50,
        around: messageId
      }
    })
      .then(res => {
        if (res.status != 200) return;
        const results = res.body;
        const final = results.filter(x => this.cachedMessageRecord.findIndex(m => x.id === m.id) == -1);
        this.cachedMessageRecord.push(...final);
      })
      .catch(err => {
        ZeresPluginLibrary.Logger.stacktrace(this.getName(), `Error caching messages from ${channelId} around ${messageId}`, err);
      });
  }
  formatMarkup(content, channelId) {
    const markup = document.createElement('div');

    const parsed = this.tools.parse(content, true, channelId ? { channelId: channelId } : {});
    // error, this render doesn't work with tags
    //  TODO: this parser and renderer sucks
    // this may be causing a severe memory leak over the course of a few hours
    let root;
    if (BdApi.ReactDOM.createRoot) {
      root = BdApi.ReactDOM.createRoot(markup);
      root.render(parsed);
    } else {
      BdApi.ReactDOM.render(parsed, markup);
    }

    const hiddenClass = this.classes.hidden;

    const hidden = markup.getElementsByClassName(hiddenClass);

    for (let i = 0; i < hidden.length; i++) {
      hidden[i].classList.remove(hiddenClass);
    }
    let previousTab = this.menu.selectedTab;
    let previousOpen = this.menu.open;
    const callback = () => {
      if (this.menu.open === previousOpen && this.menu.selectedTab === previousTab) return; /* lol ez */
      try {
        if (root && root.unmount) root.unmount();
        else BdApi.ReactDOM.unmountComponentAtNode && BdApi.ReactDOM.unmountComponentAtNode(markup);
      } catch (e) {
        ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Error unmounting markup', e);
      }
      ZeresPluginLibrary.DOMTools.observer.unsubscribe(callback);
    };
    ZeresPluginLibrary.DOMTools.observer.subscribe(callback, mutation => {
      const nodes = Array.from(mutation.removedNodes);
      const directMatch = nodes.indexOf(markup) > -1;
      const parentMatch = nodes.some(parent => parent.contains(markup));
      return directMatch || parentMatch;
    });
    return markup;
  }
  async showToast(content, options = {}) {
    // credits to Zere, copied from Zeres Plugin Library
    const { type = '', icon = '', timeout = 3000, onClick = () => { }, onContext = () => { } } = options;
    ZeresPluginLibrary.Toasts.ensureContainer();
    const toast = ZeresPluginLibrary['DOMTools'].parseHTML(ZeresPluginLibrary.Toasts.buildToast(content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'), ZeresPluginLibrary.Toasts.parseType(type), icon));
    toast.style.pointerEvents = 'auto';
    document.querySelector('.toasts').appendChild(toast);
    let sto2;
    const wait = () => {
      toast.classList.add('closing');
      sto2 = setTimeout(() => {
        toast.remove();
        if (!document.querySelectorAll('.toasts .toast').length) document.querySelector('.toasts').remove();
      }, 300);
    };
    const sto = setTimeout(wait, timeout);
    const toastClicked = () => {
      clearTimeout(sto);
      clearTimeout(sto2);
      wait();
    };
    toast.addEventListener('auxclick', toastClicked);
    toast.addEventListener('click', () => {
      toastClicked();
      onClick();
    });
    toast.addEventListener('contextmenu', () => {
      toastClicked();
      onContext();
    });
  }
  clamp(val, min, max) {
    // this is so sad, can we hit Metalloriff?
    // his message log added the func to Math obj and I didn't realize
    return Math.max(min, Math.min(val, max));
  }
  deleteEditedMessageFromRecord(id, editNum) {
    const record = this.messageRecord[id];
    if (!record) return;

    record.edit_history.splice(editNum, 1);
    if (!record.edit_history.length) record.edit_history = null;
    else return this.saveData();

    const channelId = record.message.channel_id;
    const channelMessages = this.editedMessageRecord[channelId];
    channelMessages.splice(
      channelMessages.findIndex(m => m === id),
      1
    );
    if (this.deletedMessageRecord[channelId] && this.deletedMessageRecord[channelId].findIndex(m => m === id) != -1) return this.saveData();
    if (this.purgedMessageRecord[channelId] && this.purgedMessageRecord[channelId].findIndex(m => m === id) != -1) return this.saveData();
    delete this.messageRecord[id];
    this.saveData();
  }
  jumpToMessage(channelId, messageId, guildId) {
    if (this.menu.open) XenoLib.ModalStack.closeModal(this.style.menu);
    ZeresPluginLibrary.DiscordModules.NavigationUtils.transitionTo(`/channels/${guildId || '@me'}/${channelId}${messageId ? '/' + messageId : ''}`);
  }
  isImage(url) {
    return /\.(jpe?g|png|gif|bmp)(?:$|\?)/i.test(url);
  }
  cleanupEmbed(embed) {
    /* backported code from message-log rewrite */
    if (!embed.id) return embed; /* already cleaned */
    const retEmbed = {};
    if (typeof embed.rawTitle === 'string') retEmbed.title = embed.rawTitle;
    if (typeof embed.rawDescription === 'string') retEmbed.description = embed.rawDescription;
    if (typeof embed.referenceId !== 'undefined') retEmbed.reference_id = embed.referenceId;
    if (typeof embed.color === 'string') retEmbed.color = ZeresPluginLibrary.ColorConverter.hex2int(embed.color);
    if (typeof embed.type !== 'undefined') retEmbed.type = embed.type;
    if (typeof embed.url !== 'undefined') retEmbed.url = embed.url;
    if (typeof embed.provider === 'object') retEmbed.provider = { name: embed.provider.name, url: embed.provider.url };
    if (typeof embed.footer === 'object') retEmbed.footer = { text: embed.footer.text, icon_url: embed.footer.iconURL, proxy_icon_url: embed.footer.iconProxyURL };
    if (typeof embed.author === 'object') retEmbed.author = { name: embed.author.name, url: embed.author.url, icon_url: embed.author.iconURL, proxy_icon_url: embed.author.iconProxyURL };
    if (typeof embed.timestamp === 'object' && embed.timestamp._isAMomentObject) retEmbed.timestamp = embed.timestamp.milliseconds();
    if (typeof embed.thumbnail === 'object') {
      if (typeof embed.thumbnail.proxyURL === 'string' || (typeof embed.thumbnail.url === 'string' && !embed.thumbnail.url.endsWith('?format=jpeg'))) {
        retEmbed.thumbnail = {
          url: embed.thumbnail.url,
          proxy_url: typeof embed.thumbnail.proxyURL === 'string' ? embed.thumbnail.proxyURL.split('?format')[0] : undefined,
          width: embed.thumbnail.width,
          height: embed.thumbnail.height
        };
      }
    }
    if (typeof embed.image === 'object') {
      retEmbed.image = {
        url: embed.image.url,
        proxy_url: embed.image.proxyURL,
        width: embed.image.width,
        height: embed.image.height
      };
    }
    if (typeof embed.video === 'object') {
      retEmbed.video = {
        url: embed.video.url,
        proxy_url: embed.video.proxyURL,
        width: embed.video.width,
        height: embed.video.height
      };
    }
    if (Array.isArray(embed.fields) && embed.fields.length) {
      retEmbed.fields = embed.fields.map(e => ({ name: e.rawName, value: e.rawValue, inline: e.inline }));
    }
    return retEmbed;
  }
  fixEmbeds(message) {
    message.embeds = message.embeds.map(this.cleanupEmbed);
  }
  isCompact() {
    return false; // fix if someone complains, no one has so far so who cares
  }
  /* ==================================================-|| END HELPERS ||-================================================== */
  /* ==================================================-|| START MISC ||-================================================== */
  addOpenLogsButton() {
    if (!this.selectedChannel) return;
    const parent = document.querySelector('div[class*="chat_"] div[class*="toolbar_"]');
    if (!parent) return;
    const srch = parent.querySelector('div[class*="search_"]'); // you know who you are that think this is my issue
    if (!srch) return;
    parent.insertBefore(this.channelLogButton, srch);
  }
  removeOpenLogsButton() {
    this.channelLogButton.remove();
  }
  showLoggerHelpModal(initial = false) {
    const s = (el, styles) => { Object.assign(el.style, styles); return el; };
    const existing = document.getElementById('mlf-help-modal');
    if (existing) { existing.remove(); return; }

    const overlay = document.createElement('div');
    overlay.id = 'mlf-help-modal';
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.7)', zIndex: '1010',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const box = document.createElement('div');
    Object.assign(box.style, {
      background: 'linear-gradient(165deg, #0d0a1a 0%, #1a1028 40%, #0d0a1a 100%)',
      borderRadius: '10px', padding: '28px', maxWidth: '560px', width: '92%',
      boxShadow: '0 0 40px rgba(212,175,55,0.08), 0 8px 32px rgba(0,0,0,0.6)',
      border: '1px solid rgba(212,175,55,0.12)',
      color: '#ccc', fontSize: '14px', lineHeight: '1.7', maxHeight: '80vh', overflowY: 'auto'
    });

    const title = document.createElement('h2');
    Object.assign(title.style, { color: '#d4af37', marginBottom: '16px', fontSize: '20px', textShadow: '0 0 12px rgba(212,175,55,0.3)' });
    title.textContent = '\u2728 𝗐𝐞𝗅𝖼𝐨𝗆𝐞 𝗍𝐨 messageloggerfix';
    box.appendChild(title);

    const section = (heading, items) => {
      const h = document.createElement('h3');
      Object.assign(h.style, { color: '#d4af37', fontSize: '15px', marginTop: '16px', marginBottom: '8px' });
      h.textContent = heading;
      box.appendChild(h);
      for (const item of items) {
        const p = document.createElement('p');
        Object.assign(p.style, { margin: '4px 0', paddingLeft: '12px', borderLeft: '2px solid rgba(212,175,55,0.15)' });
        p.innerHTML = item;
        box.appendChild(p);
      }
    };

    section('\u2728 𝗀𝐞𝗍𝗍𝐢𝗇𝗀 𝗌𝗍𝐚𝗋𝗍𝐞𝖽', [
      '\u2705 <strong style="color:#d4af37">𝗅𝐨𝗀𝗀𝐢𝗇𝗀 𝐢𝗌 𝐨𝗇 𝖻𝗒 𝖽𝐞𝖿𝐚𝐮𝗅𝗍</strong> 𝖿𝐨𝗋 𝐚𝗅𝗅 𝐮𝗇𝗆𝐮𝗍𝐞𝖽 𝗌𝐞𝗋𝗏𝐞𝗋𝗌 𝐚𝗇𝖽 𝖼𝗁𝐚𝗇𝗇𝐞𝗅𝗌. 𝗇𝐨 𝗌𝐞𝗍𝐮𝗉 𝗇𝐞𝐞𝖽𝐞𝖽!',
      '\ud83d\udeab <strong style="color:#d4af37">𝗍𝐨 𝗌𝗍𝐨𝗉 𝗅𝐨𝗀𝗀𝐢𝗇𝗀 𝐚 𝗌𝐞𝗋𝗏𝐞𝗋:</strong> 𝗋𝐢𝗀𝗁𝗍 𝖼𝗅𝐢𝖼𝗄 𝐢𝗍 \u2192 MessageLoggerFix \u2192 <strong style="color:#f04747">𝖻𝗅𝐨𝖼𝗄</strong>.',
      '\u2699\ufe0f <strong style="color:#d4af37">𝗆𝐚𝗇𝐚𝗀𝐞 𝐚𝗅𝗅 𝗌𝐞𝗋𝗏𝐞𝗋𝗌:</strong> 𝗀𝐞𝐚𝗋 𝐢𝖼𝐨𝗇 𝐢𝗇 𝗍𝗁𝐞 𝗅𝐨𝗀𝗌 𝖿𝐨𝐨𝗍𝐞𝗋, 𝐨𝗋 𝗋𝐢𝗀𝗁𝗍 𝖼𝗅𝐢𝖼𝗄 𝐚𝗇𝗒 𝗌𝐞𝗋𝗏𝐞𝗋.'
    ]);

    section('\ud83d\udcdc 𝗊𝐮𝐢𝖼𝗄 𝗋𝐞𝖿𝐞𝗋𝐞𝗇𝖼𝐞', [
      '\ud83d\udccc <strong style="color:#d4af37">𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌</strong> \u2014 𝖻𝐮𝗍𝗍𝐨𝗇 𝐢𝗇 𝗍𝗁𝐞 𝗍𝐨𝗉 𝗋𝐢𝗀𝗁𝗍 𝐨𝖿 𝖼𝗁𝐚𝗇𝗇𝐞𝗅𝗌, 𝐨𝗋 𝗋𝐢𝗀𝗁𝗍 𝖼𝗅𝐢𝖼𝗄 𝐚𝗇𝗒 𝗌𝐞𝗋𝗏𝐞𝗋.',
      '\ud83d\uddd1\ufe0f <strong style="color:#d4af37">𝖽𝐞𝗅𝐞𝗍𝐞𝖽 𝗆𝐞𝗌𝗌𝐚𝗀𝐞𝗌</strong> \u2014 𝐚𝗉𝗉𝐞𝐚𝗋 𝐢𝗇 𝗋𝐞𝖽 𝗍𝐞𝗑𝗍 𝐢𝗇 𝖼𝗁𝐚𝗍. 𝗋𝐢𝗀𝗁𝗍 𝖼𝗅𝐢𝖼𝗄 𝖿𝐨𝗋 𝐨𝗉𝗍𝐢𝐨𝗇𝗌.',
      '\u2728 <strong style="color:#d4af37">𝐞𝗑𝗉𝐨𝗋𝗍</strong> \u2014 𝗌𝐚𝗏𝐞 𝗅𝐨𝗀𝗌 𝐚𝗌 JSON, 𝗍𝐞𝗑𝗍, 𝐨𝗋 CSV 𝗐𝐢𝗍𝗁 𝖽𝐚𝗍𝐞 𝐚𝗇𝖽 𝗌𝐞𝗋𝗏𝐞𝗋 𝖿𝐢𝗅𝗍𝐞𝗋𝗌.'
    ]);

    section('\ud83d\udcc1 𝗐𝗁𝐞𝗋𝐞 𝗒𝐨𝐮𝗋 𝖽𝐚𝗍𝐚 𝗅𝐢𝗏𝐞𝗌', [
      '\ud83d\udcc4 <strong style="color:#d4af37">𝗆𝐞𝗌𝗌𝐚𝗀𝐞 𝗍𝐞𝗑𝗍, 𝐞𝖽𝐢𝗍 𝗁𝐢𝗌𝗍𝐨𝗋𝗒, 𝗍𝐢𝗆𝐞𝗌𝗍𝐚𝗆𝗉𝗌, 𝐚𝗇𝖽 𝗆𝐞𝗍𝐚𝖽𝐚𝗍𝐚</strong> 𝐚𝗋𝐞 𝗌𝐚𝗏𝐞𝖽 𝐢𝗇 𝐚 JSON 𝖿𝐢𝗅𝐞.',
      '\ud83d\uddbc\ufe0f <strong style="color:#d4af37">𝐢𝗆𝐚𝗀𝐞𝗌 𝖿𝗋𝐨𝗆 𝖽𝐞𝗅𝐞𝗍𝐞𝖽 𝗆𝐞𝗌𝗌𝐚𝗀𝐞𝗌</strong> 𝐚𝗋𝐞 𝖼𝐚𝖼𝗁𝐞𝖽 𝐚𝗌 𝗌𝐞𝗉𝐚𝗋𝐚𝗍𝐞 𝖿𝐢𝗅𝐞𝗌 𝐢𝗇 𝐚 𝗌𝐮𝖻𝖿𝐨𝗅𝖽𝐞𝗋.',
      '\ud83d\udd17 <strong style="color:#d4af37">𝖻𝐨𝗍𝗁 𝗅𝐢𝗏𝐞 𝗍𝐨𝗀𝐞𝗍𝗁𝐞𝗋</strong> 𝐢𝗇 <code style="background:rgba(212,175,55,0.1);padding:2px 6px;border-radius:3px;color:#d4af37">messageloggerfix-logs/</code> 𝖻𝐞𝖼𝐚𝐮𝗌𝐞 𝗍𝗁𝐞𝗒 𝗋𝐞𝖿𝐞𝗋𝐞𝗇𝖼𝐞 𝐞𝐚𝖼𝗁 𝐨𝗍𝗁𝐞𝗋 \u2014 𝗍𝗁𝐞 JSON 𝗋𝐞𝖼𝐨𝗋𝖽𝗌 𝗉𝐨𝐢𝗇𝗍 𝗍𝐨 𝗍𝗁𝐞 𝖼𝐚𝖼𝗁𝐞𝖽 𝐢𝗆𝐚𝗀𝐞𝗌 𝖻𝗒 𝐢𝖽.',
      '\u26a0\ufe0f 𝖽𝐨 𝗇𝐨𝗍 𝗆𝐨𝗏𝐞 𝐨𝗋 𝗋𝐞𝗇𝐚𝗆𝐞 𝗍𝗁𝐞𝗌𝐞 𝖿𝐢𝗅𝐞𝗌 𝗐𝗁𝐢𝗅𝐞 Discord 𝐢𝗌 𝗋𝐮𝗇𝗇𝐢𝗇𝗀.'
    ]);

    const okBtn = document.createElement('button');
    Object.assign(okBtn.style, {
      marginTop: '20px', background: 'linear-gradient(135deg, #d4af37 0%, #c5981e 100%)',
      color: '#0d0a1a', border: 'none', padding: '10px 28px',
      borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
      boxShadow: '0 0 10px rgba(212,175,55,0.2)', display: 'block', margin: '20px auto 0'
    });
    okBtn.textContent = '\u2728 𝐨𝗄 𝗀𝐨𝗍 𝐢𝗍';
    okBtn.onclick = () => overlay.remove();
    box.appendChild(okBtn);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }
  showStatsModal() {
    const elements = [];
    let totalMessages = Object.keys(this.messageRecord).length;
    let messageCounts = [];
    let spaceUsageMB = 0;
    let cachedImageCount = 0;
    let cachedImagesUsageMB = 0;

    let mostDeletesChannel = { num: 0, id: '' };
    let mostEditsChannel = { num: 0, id: '' };
    let deleteDataTemp = {};
    let editDataTemp = {};

    for (const map of [this.deletedMessageRecord, this.editedMessageRecord, this.cachedMessageRecord]) {
      let messageCount = 0;
      if (!Array.isArray(map)) {
        for (const channelId in map) {
          if (!deleteDataTemp[channelId]) deleteDataTemp[channelId] = [];
          if (!editDataTemp[channelId]) editDataTemp[channelId] = [];
          for (const messageId of map[channelId]) {
            messageCount++;
            const record = this.messageRecord[messageId];
            if (!record) continue; // wtf?
            if (record.delete_data && deleteDataTemp[channelId].findIndex(m => m === messageId)) deleteDataTemp[channelId].push(messageId);
            if (record.edit_history && editDataTemp[channelId].findIndex(m => m === messageId)) editDataTemp[channelId].push(messageId);
          }
        }
      }
      for (const channelId in deleteDataTemp) if (deleteDataTemp[channelId].length > mostDeletesChannel.num) mostDeletesChannel = { num: deleteDataTemp[channelId].length, id: channelId };
      for (const channelId in editDataTemp) if (editDataTemp[channelId].length > mostEditsChannel.num) mostEditsChannel = { num: editDataTemp[channelId].length, id: channelId };

      messageCounts.push(messageCount);
    }
    const addLine = (name, value) => {
      elements.push(
        React.createElement('div', { className: this.multiClasses.defaultColor, key: name },
          React.createElement('strong', null, `${name}: `),
          value
        )
      );
    };
    addLine('Total messages', totalMessages);
    addLine('Deleted message count', messageCounts[0]);
    addLine('Edited message count', messageCounts[1]);
    addLine('Sent message count', this.cachedMessageRecord.length);

    let channel = this.tools.getChannel(mostDeletesChannel.id);
    if (channel) addLine('Most deletes', mostDeletesChannel.num + ' ' + this.getLiteralName(channel.guild_id, channel.id));
    if (channel) addLine('Most edits', mostEditsChannel.num + ' ' + this.getLiteralName(channel.guild_id, channel.id));

    //    addLine('Data file size', (this.nodeModules.fs.statSync(this.pluginDir + '/messageloggerfix-data.config.json').size / 1024 / 1024).toFixed(2) + 'MB');
    //  addLine('Data file size severity', this.slowSaveModeStep == 0 ? 'OK' : this.slowSaveModeStep == 1 ? 'MILD' : this.slowSaveModeStep == 2 ? 'BAD' : 'EXTREME');

    BdApi.UI.showConfirmationModal('Data stats', React.createElement('div', null, elements), {
      confirmText: 'OK',
      cancelText: null
    });
  }
  showClearConfirmation(what, onConfirm) {
    if (this.settings.skipClearConfirm) { onConfirm(); return; }

    const s = (el, styles) => { Object.assign(el.style, styles); return el; };
    const existing = document.getElementById('mlf-clear-confirm');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mlf-clear-confirm';
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.7)', zIndex: '1020',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const box = document.createElement('div');
    Object.assign(box.style, {
      background: 'linear-gradient(165deg, #0d0a1a 0%, #1a1028 40%, #0d0a1a 100%)',
      borderRadius: '10px', padding: '24px', width: '420px', maxWidth: '90vw',
      boxShadow: '0 0 40px rgba(212,175,55,0.08), 0 8px 32px rgba(0,0,0,0.6)',
      border: '1px solid rgba(240,71,71,0.3)',
      color: '#ccc', fontSize: '14px', textAlign: 'center'
    });

    const icon = document.createElement('div');
    Object.assign(icon.style, { fontSize: '32px', marginBottom: '12px' });
    icon.textContent = '\u26a0\ufe0f';
    box.appendChild(icon);

    const title = document.createElement('h3');
    Object.assign(title.style, { color: '#f04747', marginBottom: '8px', fontSize: '16px' });
    title.textContent = '𝐚𝗋𝐞 𝗒𝐨𝐮 𝗌𝐮𝗋𝐞?';
    box.appendChild(title);

    const msg = document.createElement('p');
    Object.assign(msg.style, { marginBottom: '16px', lineHeight: '1.5', opacity: '0.8' });
    msg.textContent = `𝗍𝗁𝐢𝗌 𝗐𝐢𝗅𝗅 𝗉𝐞𝗋𝗆𝐚𝗇𝐞𝗇𝗍𝗅𝗒 𝖽𝐞𝗅𝐞𝗍𝐞 ${what}. 𝗍𝗁𝐢𝗌 𝖼𝐚𝗇𝗇𝐨𝗍 𝖻𝐞 𝐮𝗇𝖽𝐨𝗇𝐞.`;
    box.appendChild(msg);

    // Don't ask again checkbox
    const checkRow = document.createElement('label');
    Object.assign(checkRow.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '8px', marginBottom: '16px', cursor: 'pointer', fontSize: '12px', opacity: '0.6'
    });
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    Object.assign(checkbox.style, { cursor: 'pointer' });
    checkRow.appendChild(checkbox);
    checkRow.appendChild(document.createTextNode('𝖽𝐨𝗇\'𝗍 𝐚𝗌𝗄 𝗆𝐞 𝐚𝗀𝐚𝐢𝗇'));
    box.appendChild(checkRow);

    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { display: 'flex', gap: '10px', justifyContent: 'center' });

    const cancelBtn = document.createElement('button');
    Object.assign(cancelBtn.style, {
      background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
      color: '#d4af37', cursor: 'pointer', padding: '8px 24px', borderRadius: '4px',
      fontSize: '14px', fontWeight: '500'
    });
    cancelBtn.textContent = '𝖼𝐚𝗇𝖼𝐞𝗅';
    cancelBtn.onclick = () => overlay.remove();
    btnRow.appendChild(cancelBtn);

    const confirmBtn = document.createElement('button');
    Object.assign(confirmBtn.style, {
      background: '#d83c3e', border: 'none',
      color: 'white', cursor: 'pointer', padding: '8px 24px', borderRadius: '4px',
      fontSize: '14px', fontWeight: '500'
    });
    confirmBtn.textContent = '\ud83d\uddd1\ufe0f 𝖽𝐞𝗅𝐞𝗍𝐞';
    confirmBtn.onclick = () => {
      if (checkbox.checked) {
        this.settings.skipClearConfirm = true;
        this.saveSettings();
      }
      overlay.remove();
      onConfirm();
    };
    btnRow.appendChild(confirmBtn);
    box.appendChild(btnRow);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }
  showManageListsModal() {
    const existing = document.getElementById('mlf-manage-overlay');
    if (existing) { existing.remove(); return; }

    const s = (el, styles) => { Object.assign(el.style, styles); return el; };
    const div = (id) => { const d = document.createElement('div'); if (id) d.id = id; return d; };

    const overlay = s(div('mlf-manage-overlay'), {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.6)', zIndex: '1010',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const box = s(div(), {
      background: 'linear-gradient(165deg, #0d0a1a 0%, #1a1028 40%, #0d0a1a 100%)',
      borderRadius: '10px', padding: '24px', width: '640px', maxWidth: '92vw',
      boxShadow: '0 0 40px rgba(212,175,55,0.08), 0 8px 32px rgba(0,0,0,0.6)',
      border: '1px solid rgba(212,175,55,0.12)',
      color: '#ccc', fontSize: '14px', maxHeight: '80vh', overflowY: 'auto'
    });

    const title = document.createElement('h2');
    Object.assign(title.style, { color: '#d4af37', marginBottom: '16px', fontSize: '18px', textShadow: '0 0 12px rgba(212,175,55,0.3)' });
    title.textContent = '\u2699\ufe0f manage server lists';
    box.appendChild(title);

    // Collect all known guilds
    const allGuilds = {};  // id -> { name, active }
    const GuildStore = ZeresPluginLibrary.WebpackModules.getByProps('getGuild', 'getGuildCount');
    const allJoinedGuilds = GuildStore.getGuilds ? GuildStore.getGuilds() : {};
    const joinedIds = new Set(Object.keys(allJoinedGuilds));

    // From all joined guilds first
    for (const id in allJoinedGuilds) {
      allGuilds[id] = { name: allJoinedGuilds[id].name, active: true };
    }
    // From settings (may include servers we left)
    for (const id of [...(this.settings.whitelist || []), ...(this.settings.blacklist || [])]) {
      if (!allGuilds[id]) {
        const guild = GuildStore.getGuild(id);
        allGuilds[id] = { name: guild ? guild.name : id, active: joinedIds.has(id) };
      }
    }
    // From logged data (may include servers we left)
    for (const map of [this.deletedMessageRecord, this.editedMessageRecord, this.purgedMessageRecord]) {
      for (const chId in map) {
        for (const msgId of map[chId]) {
          const rec = this.messageRecord[msgId];
          if (!rec) continue;
          const gId = rec.message.guild_id || (this.tools.getChannel(rec.message.channel_id) || {}).guild_id;
          if (gId && !allGuilds[gId]) {
            const guild = GuildStore.getGuild(gId);
            allGuilds[gId] = { name: guild ? guild.name : gId, active: joinedIds.has(gId) };
          }
        }
      }
    }

    const sorted = Object.entries(allGuilds).sort((a, b) => {
      // Active servers first, then inactive
      if (a[1].active !== b[1].active) return a[1].active ? -1 : 1;
      return a[1].name.localeCompare(b[1].name);
    });

    if (!sorted.length) {
      const empty = document.createElement('p');
      empty.textContent = 'no servers found.';
      Object.assign(empty.style, { opacity: '0.5', textAlign: 'center', padding: '20px' });
      box.appendChild(empty);
    }

    // Legend
    const legend = s(div(), { display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', opacity: '0.6' });
    legend.innerHTML = '<span>\u2705 = 𝗅𝐨𝗀𝗀𝐢𝗇𝗀</span><span style="color:#f04747">\ud83d\udeab = 𝖻𝗅𝐨𝖼𝗄𝐞𝖽</span>';
    box.appendChild(legend);

    // Bulk actions row
    const bulkRow = s(div(), { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' });
    const makeBulkBtn = (text, action) => {
      const b = document.createElement('button');
      b.textContent = text;
      Object.assign(b.style, {
        background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
        color: '#d4af37', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px',
        fontSize: '12px', fontWeight: '500', transition: 'all 0.15s ease'
      });
      b.onmouseenter = () => { b.style.background = 'rgba(212,175,55,0.18)'; };
      b.onmouseleave = () => { b.style.background = 'rgba(212,175,55,0.08)'; };
      b.onclick = action;
      return b;
    };
    bulkRow.appendChild(makeBulkBtn('log all', () => {
      this.settings.blacklist = [];
      this.settings.whitelist = [];
      this.saveSettings(); rebuild();
    }));
    bulkRow.appendChild(makeBulkBtn('block all', () => {
      for (const [rawId, info] of sorted) {
        const sid = String(rawId);
        if (!info.active) continue;
        if (!this.settings.blacklist.some(x => String(x) === sid)) this.settings.blacklist.push(sid);
      }
      this.settings.whitelist = [];
      this.saveSettings(); rebuild();
    }));
    box.appendChild(bulkRow);

    // Server list container
    const listContainer = s(div('mlf-manage-list'), {});

    const rebuild = () => {
      listContainer.innerHTML = '';
      for (const [rawId, info] of sorted) {
        const id = String(rawId);
        const name = info.name;
        const active = info.active;
        const isBlocked = this.settings.blacklist.some(x => String(x) === id);

        const row = s(div(), {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', marginBottom: '4px',
          borderRadius: '6px', background: isBlocked ? 'rgba(240,71,71,0.05)' : 'rgba(212,175,55,0.03)',
          border: isBlocked ? '1px solid rgba(240,71,71,0.3)' : '1px solid rgba(212,175,55,0.06)',
          opacity: active ? '1' : '0.6',
          transition: 'all 0.15s ease'
        });

        const nameSpan = document.createElement('span');
        const statusIcon = isBlocked ? '\ud83d\udeab ' : '\u2705 ';
        const inactiveTag = active ? '' : ' \ud83d\udc80 left server';
        nameSpan.textContent = statusIcon + name + inactiveTag;
        Object.assign(nameSpan.style, {
          color: !active ? '#888' : isBlocked ? '#f04747' : '#ccc',
          fontWeight: '500', fontSize: '14px', flex: '1', minWidth: '0',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        });
        row.appendChild(nameSpan);

        const btnGroup = s(div(), { display: 'flex', gap: '4px', flexShrink: '0' });

        const makeSmallBtn = (label, color, action) => {
          const b = document.createElement('button');
          b.textContent = label;
          Object.assign(b.style, {
            background: 'transparent', border: 'none', color: color,
            cursor: 'pointer', padding: '4px 8px', borderRadius: '3px',
            fontSize: '11px', fontWeight: '600', transition: 'background 0.15s ease'
          });
          b.onmouseenter = () => { b.style.background = 'rgba(255,255,255,0.05)'; };
          b.onmouseleave = () => { b.style.background = 'transparent'; };
          b.onclick = action;
          return b;
        };

        // Single toggle button
        btnGroup.appendChild(makeSmallBtn(
          isBlocked ? 'unblock' : 'block',
          isBlocked ? '#4ade80' : '#f04747',
          () => {
            if (isBlocked) {
              const bIdx = this.settings.blacklist.findIndex(x => String(x) === id);
              if (bIdx !== -1) this.settings.blacklist.splice(bIdx, 1);
            } else {
              // Remove from whitelist if present
              const wIdx = this.settings.whitelist.findIndex(x => String(x) === id);
              if (wIdx !== -1) this.settings.whitelist.splice(wIdx, 1);
              if (!this.settings.blacklist.some(x => String(x) === id)) this.settings.blacklist.push(id);
            }
            this.saveSettings(); rebuild();
          }
        ));

        // Clear logs for this server
        btnGroup.appendChild(makeSmallBtn('clear logs', '#888', () => {
          this.showClearConfirmation(`𝐚𝗅𝗅 𝗅𝐨𝗀𝗌 𝖿𝗋𝐨𝗆 ${name}`, () => {
            let count = 0;
            for (const map of [this.deletedMessageRecord, this.editedMessageRecord, this.purgedMessageRecord]) {
              for (const chId in map) {
                const toRemove = [];
                for (let i = 0; i < map[chId].length; i++) {
                  const rec = this.messageRecord[map[chId][i]];
                  if (!rec) continue;
                  const gId = rec.message.guild_id || (this.tools.getChannel(rec.message.channel_id) || {}).guild_id;
                  if (gId === id) toRemove.push(i);
                }
                for (let i = toRemove.length - 1; i >= 0; i--) {
                  const msgId = map[chId][toRemove[i]];
                  delete this.messageRecord[msgId];
                  map[chId].splice(toRemove[i], 1);
                  count++;
                }
                if (!map[chId].length) delete map[chId];
              }
            }
            this.saveData();
            this.showToast(`Cleared ${count} messages from ${name}`, { type: 'success' });
          });
        }));

        row.appendChild(btnGroup);
        listContainer.appendChild(row);
      }
    };

    rebuild();
    box.appendChild(listContainer);

    // Close button
    const closeBtn = document.createElement('button');
    Object.assign(closeBtn.style, {
      marginTop: '16px', background: 'linear-gradient(135deg, #d4af37 0%, #c5981e 100%)',
      color: '#0d0a1a', border: 'none', padding: '10px 28px',
      borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
      boxShadow: '0 0 10px rgba(212,175,55,0.2)', display: 'block', margin: '16px auto 0'
    });
    closeBtn.textContent = '\u2728 done';
    closeBtn.onclick = () => overlay.remove();
    box.appendChild(closeBtn);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  showExportModal() {
    const existing = document.getElementById('mlf-export-overlay');
    if (existing) { existing.remove(); return; }

    const s = (el, styles) => { Object.assign(el.style, styles); return el; };
    const div = (id) => { const d = document.createElement('div'); if (id) d.id = id; return d; };

    const overlay = s(div('mlf-export-overlay'), {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.6)', zIndex: '1010',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const box = s(div(), {
      background: 'var(--background-primary, #36393f)',
      borderRadius: '8px', padding: '24px', width: '480px', maxWidth: '90vw',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', color: 'var(--text-normal, #dcddde)',
      fontSize: '14px', maxHeight: '80vh', overflowY: 'auto'
    });

    const title = document.createElement('h2');
    s(title, { color: 'var(--header-primary, #fff)', marginBottom: '16px', fontSize: '18px' });
    title.textContent = '𝐞𝗑𝗉𝐨𝗋𝗍 𝗆𝐞𝗌𝗌𝐚𝗀𝐞𝗌';
    box.appendChild(title);

    // Data location info
    const infoBox = s(div(), {
      background: 'var(--background-secondary, #2f3136)', borderRadius: '4px',
      padding: '10px 12px', marginBottom: '16px', fontSize: '12px',
      color: 'var(--text-muted, #72767d)', lineHeight: '1.5'
    });
    const dataPath = this.nodeModules.path.join(this.dataDir, this.getName() + 'Data.config.json');
    infoBox.textContent = 'Data is saved at: ' + dataPath;
    box.appendChild(infoBox);

    const makeLabel = (text) => {
      const l = document.createElement('label');
      s(l, { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600',
        color: 'var(--header-secondary, #b9bbbe)', textTransform: 'uppercase' });
      l.textContent = text;
      return l;
    };
    const makeSelect = (options) => {
      const sel = document.createElement('select');
      s(sel, {
        width: '100%', background: 'var(--background-tertiary, #202225)',
        color: 'var(--text-normal, #dcddde)', border: 'none', borderRadius: '4px',
        padding: '8px 10px', fontSize: '14px', marginBottom: '12px', outline: 'none'
      });
      for (const [val, label] of options) {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = label;
        sel.appendChild(opt);
      }
      return sel;
    };
    const makeInput = (type, defaultVal) => {
      const inp = document.createElement('input');
      inp.type = type;
      if (defaultVal) inp.value = defaultVal;
      s(inp, {
        width: '100%', background: 'var(--background-tertiary, #202225)',
        color: 'var(--text-normal, #dcddde)', border: 'none', borderRadius: '4px',
        padding: '8px 10px', fontSize: '14px', marginBottom: '12px', outline: 'none',
        boxSizing: 'border-box', colorScheme: 'dark'
      });
      return inp;
    };

    // Data type selector
    box.appendChild(makeLabel('𝖽𝐚𝗍𝐚 𝗍𝐨 𝐞𝗑𝗉𝐨𝗋𝗍'));
    const dataTypeSelect = makeSelect([
      ['all', '𝐚𝗅𝗅 𝗅𝐨𝗀𝗀𝐞𝖽 𝗆𝐞𝗌𝗌𝐚𝗀𝐞𝗌'],
      ['deleted', '𝖽𝐞𝗅𝐞𝗍𝐞𝖽 𝐨𝗇𝗅𝗒'],
      ['edited', '𝐞𝖽𝐢𝗍𝐞𝖽 𝐨𝗇𝗅𝗒'],
      ['purged', '𝗉𝐮𝗋𝗀𝐞𝖽 𝐨𝗇𝗅𝗒'],
      ['ghostpings', '𝗀𝗁𝐨𝗌𝗍 𝗉𝐢𝗇𝗀𝗌 𝐨𝗇𝗅𝗒'],
      ['images', '𝐢𝗆𝐚𝗀𝐞𝗌 𝐨𝗇𝗅𝗒']
    ]);
    box.appendChild(dataTypeSelect);

    // Server selector
    box.appendChild(makeLabel('𝗌𝐞𝗋𝗏𝐞𝗋'));
    const serverOptions = [['all', '𝐚𝗅𝗅 𝗌𝐞𝗋𝗏𝐞𝗋𝗌'], ['dms', '𝖽𝗆𝗌 𝐨𝗇𝗅𝗒']];
    const serverMap = {};
    const collectServers = (map) => {
      for (const channelId in map) {
        for (const msgId of map[channelId]) {
          const rec = this.messageRecord[msgId];
          if (!rec) continue;
          const guildId = rec.message.guild_id || (this.tools.getChannel(rec.message.channel_id) || {}).guild_id;
          if (guildId && !serverMap[guildId]) {
            const guild = this.tools.getServer(guildId);
            serverMap[guildId] = guild ? guild.name : guildId;
          }
        }
      }
    };
    collectServers(this.deletedMessageRecord);
    collectServers(this.editedMessageRecord);
    collectServers(this.purgedMessageRecord);
    const sorted = Object.entries(serverMap).sort((a, b) => a[1].localeCompare(b[1]));
    for (const [id, name] of sorted) serverOptions.push([id, name]);
    const serverSelect = makeSelect(serverOptions);
    box.appendChild(serverSelect);

    // Date range
    const dateRow = s(div(), { display: 'flex', gap: '12px' });
    const fromCol = s(div(), { flex: '1' });
    fromCol.appendChild(makeLabel('𝖿𝗋𝐨𝗆 𝖽𝐚𝗍𝐞'));
    const fromDate = makeInput('date');
    fromCol.appendChild(fromDate);
    dateRow.appendChild(fromCol);
    const toCol = s(div(), { flex: '1' });
    toCol.appendChild(makeLabel('𝗍𝐨 𝖽𝐚𝗍𝐞'));
    const toDate = makeInput('date');
    toDate.value = new Date().toISOString().split('T')[0];
    toCol.appendChild(toDate);
    dateRow.appendChild(toCol);
    box.appendChild(dateRow);

    // Format selector
    box.appendChild(makeLabel('𝖿𝐨𝗋𝗆𝐚𝗍'));
    const formatSelect = makeSelect([
      ['json', 'JSON (full data)'],
      ['txt', 'Plain Text (readable)'],
      ['csv', 'CSV (spreadsheet)']
    ]);
    box.appendChild(formatSelect);

    // Export button
    const btnRow = s(div(), { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' });
    const cancelBtn = document.createElement('button');
    s(cancelBtn, {
      background: 'var(--background-secondary, #2f3136)', border: 'none',
      color: 'var(--text-normal, #dcddde)', cursor: 'pointer',
      padding: '10px 20px', borderRadius: '4px', fontSize: '14px', fontWeight: '500'
    });
    cancelBtn.textContent = '𝖼𝐚𝗇𝖼𝐞𝗅';
    cancelBtn.onclick = () => overlay.remove();
    btnRow.appendChild(cancelBtn);

    const doExportBtn = document.createElement('button');
    s(doExportBtn, {
      background: 'var(--brand-experiment, #5865f2)', border: 'none',
      color: 'white', cursor: 'pointer',
      padding: '10px 20px', borderRadius: '4px', fontSize: '14px', fontWeight: '500'
    });
    doExportBtn.textContent = '𝐞𝗑𝗉𝐨𝗋𝗍';
    doExportBtn.onclick = () => {
      try {
        const dataType = dataTypeSelect.value;
        const serverId = serverSelect.value;
        const from = fromDate.value ? new Date(fromDate.value).getTime() : 0;
        const to = toDate.value ? new Date(toDate.value + 'T23:59:59').getTime() : Infinity;
        const format = formatSelect.value;

        // Collect message IDs
        let messageIds = [];
        const pushIds = (map) => {
          for (const ch in map) for (const id of map[ch]) messageIds.push(id);
        };
        if (dataType === 'all' || dataType === 'deleted') pushIds(this.deletedMessageRecord);
        if (dataType === 'all' || dataType === 'edited') pushIds(this.editedMessageRecord);
        if (dataType === 'all' || dataType === 'purged') pushIds(this.purgedMessageRecord);
        if (dataType === 'ghostpings') {
          for (const map of [this.deletedMessageRecord, this.editedMessageRecord, this.purgedMessageRecord]) {
            for (const ch in map) for (const id of map[ch]) {
              const rec = this.messageRecord[id];
              if (rec && rec.ghost_pinged) messageIds.push(id);
            }
          }
        }
        if (dataType === 'images') {
          pushIds(this.deletedMessageRecord);
          pushIds(this.editedMessageRecord);
          pushIds(this.purgedMessageRecord);
          const imageRe = /\.(jpe?g|png|gif|bmp|webp)(?:$|\?)/i;
          messageIds = messageIds.filter(id => {
            const rec = this.messageRecord[id];
            if (!rec) return false;
            return Array.isArray(rec.message.attachments) && rec.message.attachments.some(a => imageRe.test(a.filename || a.url || ''));
          });
        }
        messageIds = [...new Set(messageIds)];

        // Filter by server
        if (serverId !== 'all') {
          messageIds = messageIds.filter(id => {
            const rec = this.messageRecord[id];
            if (!rec) return false;
            const guildId = rec.message.guild_id || (this.tools.getChannel(rec.message.channel_id) || {}).guild_id;
            if (serverId === 'dms') return !guildId;
            return guildId === serverId;
          });
        }

        // Filter by date
        messageIds = messageIds.filter(id => {
          const rec = this.messageRecord[id];
          if (!rec) return false;
          const ts = new Date(rec.message.timestamp).getTime();
          return ts >= from && ts <= to;
        });

        // Build records
        const records = messageIds.map(id => this.messageRecord[id]).filter(Boolean);

        if (!records.length) {
          this.showToast('No messages match the selected filters!', { type: 'warning' });
          return;
        }

        let output, filename, mimeType;
        if (format === 'json') {
          output = JSON.stringify(records, null, 2);
          filename = 'messageloggerfix-export.json';
          mimeType = 'application/json';
        } else if (format === 'txt') {
          const lines = [];
          for (const rec of records) {
            const msg = rec.message;
            const time = new Date(msg.timestamp).toLocaleString();
            const author = msg.author ? msg.author.username : 'Unknown';
            const channel = this.tools.getChannel(msg.channel_id);
            const guild = this.tools.getServer(msg.guild_id || (channel && channel.guild_id));
            const location = guild ? `${guild.name} #${channel ? channel.name : 'unknown'}` : (channel ? channel.name || 'DM' : 'DM');
            let status = '';
            if (rec.delete_data) status = '[DELETED]';
            if (rec.edit_history) status += '[EDITED]';
            if (rec.ghost_pinged) status += '[GHOST PING]';
            lines.push(`${status} [${time}] [${location}] ${author}: ${msg.content}`);
            if (rec.edit_history) {
              for (const edit of rec.edit_history) {
                lines.push(`  (edit at ${new Date(edit.time).toLocaleString()}): ${edit.content}`);
              }
            }
            if (msg.attachments && msg.attachments.length) {
              for (const att of msg.attachments) {
                lines.push(`  [Attachment: ${att.filename || att.url}]`);
              }
            }
          }
          output = lines.join('\n');
          filename = 'messageloggerfix-export.txt';
          mimeType = 'text/plain';
        } else if (format === 'csv') {
          const rows = [['Timestamp', 'Author', 'Server', 'Channel', 'Content', 'Status', 'Edit History', 'Attachments'].join(',')];
          const csvEscape = (str) => '"' + String(str || '').replace(/"/g, '""').replace(/\n/g, ' ') + '"';
          for (const rec of records) {
            const msg = rec.message;
            const time = new Date(msg.timestamp).toISOString();
            const author = msg.author ? msg.author.username : 'Unknown';
            const channel = this.tools.getChannel(msg.channel_id);
            const guild = this.tools.getServer(msg.guild_id || (channel && channel.guild_id));
            const guildName = guild ? guild.name : 'DM';
            const channelName = channel ? channel.name || 'DM' : 'DM';
            let status = [];
            if (rec.delete_data) status.push('Deleted');
            if (rec.edit_history) status.push('Edited');
            if (rec.ghost_pinged) status.push('Ghost Ping');
            const editHistory = rec.edit_history ? rec.edit_history.map(e => e.content).join(' | ') : '';
            const attachments = (msg.attachments || []).map(a => a.filename || a.url).join(' | ');
            rows.push([csvEscape(time), csvEscape(author), csvEscape(guildName), csvEscape(channelName),
              csvEscape(msg.content), csvEscape(status.join(', ')), csvEscape(editHistory), csvEscape(attachments)].join(','));
          }
          output = rows.join('\n');
          filename = 'messageloggerfix-export.csv';
          mimeType = 'text/csv';
        }

        // Download
        const blob = new Blob([output], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast(`Exported ${records.length} messages as ${format.toUpperCase()}!`, { type: 'success' });
        overlay.remove();
      } catch (err) {
        console.error('[messageloggerfix] Export error:', err);
        this.showToast('Export failed! Check console for details.', { type: 'error' });
      }
    };
    btnRow.appendChild(doExportBtn);
    box.appendChild(btnRow);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }
  _findLastIndex(array, predicate) {
    let l = array.length;
    while (l--) {
      if (predicate(array[l], l, array))
        return l;
    }
    return -1;
  }
  /*
  how it works:
  messages, stripped into IDs and times into var IDs:
  [1, 2, 3, 4, 5, 6, 7]
   ^                 ^
   lowestTime      highestTime
   deletedMessages, stripped into IDs and times into var savedIDs:
   sorted by time, newest to oldest
   lowest IDX that is higher than lowestTime, unless channelEnd, then it's 0
   highest IDX that is lower than highestTime, unless channelStart, then it's savedIDs.length - 1

   savedIDs sliced start lowest IDX, end highest IDX + 1
   appended IDs
   sorted by time, oldest to newest
   iterated, checked if ID is in messages, if not, fetch from this.messageRecord and splice it in at
   specified index
  */
  reAddDeletedMessages(messages, deletedMessages, channelStart, channelEnd) {
    if (!messages.length || !deletedMessages.length) return;
    const DISCORD_EPOCH = 14200704e5;
    const IDs = [];
    const savedIDs = [];
    for (let i = 0, len = messages.length; i < len; i++) {
      const { id } = messages[i];
      IDs.push({ id: id, time: (id / 4194304) + DISCORD_EPOCH });
    }
    for (let i = 0, len = deletedMessages.length; i < len; i++) {
      const id = deletedMessages[i];
      const record = this.messageRecord[id];
      if (!record) continue;
      if (!record.delete_data) {
        /* SOME WIZARD BROKE THE MESSAGE LOG LIKE THIS, WTFFFF */
        this.deleteMessageFromRecords(id);
        continue;
      }
      if (record.delete_data.hidden) continue;
      savedIDs.push({ id: id, time: (id / 4194304) + DISCORD_EPOCH });
    }
    savedIDs.sort((a, b) => a.time - b.time);
    if (!savedIDs.length) return;
    const { time: lowestTime } = IDs[IDs.length - 1];
    const [{ time: highestTime }] = IDs;
    const lowestIDX = channelEnd ? 0 : savedIDs.findIndex(e => e.time > lowestTime);
    if (lowestIDX === -1) return;
    const highestIDX = channelStart ? savedIDs.length - 1 : this._findLastIndex(savedIDs, e => e.time < highestTime);
    if (highestIDX === -1) return;
    const reAddIDs = savedIDs.slice(lowestIDX, highestIDX + 1);
    reAddIDs.push(...IDs);
    reAddIDs.sort((a, b) => b.time - a.time);
    for (let i = 0, len = reAddIDs.length; i < len; i++) {
      const { id } = reAddIDs[i];
      if (messages.findIndex((e) => e.id === id) !== -1) continue;
      const { message } = this.messageRecord[id];
      messages.splice(i, 0, message);
    }
  }
  getLiteralName(guildId, channelId, useTags = false) {
    // TODO, custom channel server failure text
    const guild = this.tools.getServer(guildId);
    const channel = this.tools.getChannel(channelId); // todo
    /* if (typeof guildNameBackup !== 'number' && guild && guildNameBackup)  */ if (guildId) {
      const channelName = (channel ? channel.name : 'unknown-channel');
      const guildName = (guild ? guild.name : 'unknown-server');
      if (useTags && channel) return `${guildName}, <#${channel.id}>`;
      return `${guildName}, #${channelName}`;
    } else if (channel && channel.name.length) {
      return `group ${channel.name}`;
    } else if (channel && channel.type == 3) {
      let finalGroupName = '';
      for (let i of channel.recipients) {
        const user = this.tools.getUser(i);
        if (!user) continue;
        if (useTags) finalGroupName += ', <@' + user.id + '>';
        else finalGroupName += ',' + user.username;
      }
      if (!finalGroupName.length) {
        return 'unknown group';
      } else {
        finalGroupName = finalGroupName.substr(1);
        if (useTags) return `group ${finalGroupName}`;
        finalGroupName = finalGroupName.length > 10 ? finalGroupName.substr(0, 10 - 1) + '...' : finalGroupName;
        return `group ${finalGroupName}`;
      }
    } else if (channel && channel.recipients) {
      const user = this.tools.getUser(channel.recipients[0]);
      if (!user) return 'DMs';
      if (useTags) return `<@${user.id}> DMs`;
      return `${user.username} DMs`;
    } else {
      return 'DMs';
    }
  }
  saveDeletedMessage(message, targetMessageRecord) {
    let result = this.createMiniFormattedData(message);
    result.delete_data = {};
    const id = message.id;
    const channelId = message.channel_id;
    result.delete_data.time = new Date().getTime();
    result.ghost_pinged = result.local_mentioned; // it's simple bruh
    if (!Array.isArray(targetMessageRecord[channelId])) targetMessageRecord[channelId] = [];
    if (this.messageRecord[id]) {
      const record = this.messageRecord[id];
      record.delete_data = result.delete_data;
      record.ghost_pinged = result.ghost_pinged;
    } else {
      this.messageRecord[id] = result;
    }
    if (this.messageRecord[id].message.attachments) {
      const attachments = this.messageRecord[id].message.attachments;
      for (let i = 0; i < attachments.length; i++) {
        attachments[i].url = attachments[i].proxy_url; // proxy url lasts longer
      }
    }
    if (this.settings.cacheAllImages) this.cacheMessageImages(this.messageRecord[id].message);
    targetMessageRecord[channelId].push(id);
  }
  createButton(label, callback) {
    const classes = this.createButton.classes;
    const ret = this.parseHTML(`<button type="button" class="${classes.button}"><div class="${classes.buttonContents}">${label}</div></button>`);
    if (callback) ret.addEventListener('click', callback);
    return ret;
  }
  createModal(options, image, name) {
    if (image) {
      const openMediaViewer = Object.values(BdApi.Webpack.getBySource(/numMediaItems:\w\.items\.length,source:_,hasMediaOptions:!\w\.shouldHideMediaOptions/) || {})[0];
      if (!openMediaViewer || typeof openMediaViewer !== 'function') return this.showToast('Failed to open image modal, missing dependency');

      /*
      {
        className: p.modal,
        onClose: this.onCloseImage,
        items: [{
          alt: undefined,
          animated: false,
          children: undefined,
          height: 1894,
          original: 'X',
          sourceMetadata: {
            identifier: {
              attachmentId: 'X',
              filename: 'funny.jpeg',
              size: 123456,
              title: undefined,
              type: 'attachment'
            },
            message: <message object>
          },
          srcIsAnimated: false,
          trigger: 'CLICK',
          type: 'IMAGE',
          url: 'X',
          width: 2048
          zoomThumbnailPlaceholder: 'X'
        }],
        shouldHideMediaOptions: h,
        location: null != g ? g : "LazyImageZoomable",
        contextKey: this.modalContext
      })
      */
      return this.showToast('Not implemented yet');
    }

    const closeModal = () => {
      const el = document.getElementById('mlf-modal-overlay');
      if (el) el.remove();
      this.menu.filter = '';
      this.menu.serverFilter = '';
      this.menu.open = false;
      this.menu.shownMessages = -1;
      if (this.menu.messages) this.menu.messages.length = 0;
    };

    const existing = document.getElementById('mlf-modal-overlay');
    if (existing) existing.remove();

    const s = (el, styles) => { Object.assign(el.style, styles); return el; };
    const div = (id) => { const d = document.createElement('div'); if (id) d.id = id; return d; };
    const btn = (text, styles) => { const b = document.createElement('button'); b.textContent = text; Object.assign(b.style, styles); return b; };

    // Overlay
    const overlay = s(div('mlf-modal-overlay'), {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(0,0,0,0.7)', zIndex: '1000',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    // Panel
    const panel = s(div('mlf-modal-panel'), {
      position: 'relative',
      background: 'linear-gradient(165deg, #0d0a1a 0%, #1a1028 40%, #0d0a1a 100%)',
      borderRadius: '10px',
      width: '960px', maxWidth: '95vw',
      height: '80vh',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 40px rgba(212,175,55,0.08), 0 8px 32px rgba(0,0,0,0.6)',
      overflow: 'hidden',
      border: '1px solid rgba(212,175,55,0.12)'
    });

    // Close button
    const closeBtn = btn('\u00D7', {
      position: 'absolute', top: '12px', right: '12px', zIndex: '10',
      background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
      color: '#d4af37', cursor: 'pointer',
      width: '32px', height: '32px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '20px', lineHeight: '1',
      transition: 'all 0.2s ease'
    });
    closeBtn.onmouseenter = () => { closeBtn.style.color = '#fff'; closeBtn.style.background = 'rgba(212,175,55,0.25)'; closeBtn.style.boxShadow = '0 0 12px rgba(212,175,55,0.3)'; };
    closeBtn.onmouseleave = () => { closeBtn.style.color = '#d4af37'; closeBtn.style.background = 'rgba(212,175,55,0.1)'; closeBtn.style.boxShadow = 'none'; };
    closeBtn.onclick = closeModal;
    panel.appendChild(closeBtn);

    // Header
    const header = s(div('mlf-modal-header'), {
      padding: '16px 20px 14px 20px', flexShrink: '0',
      borderBottom: '1px solid rgba(212,175,55,0.12)'
    });
    if (options.header) {
      if (typeof options.header === 'string') {
        const h2 = document.createElement('h2');
        h2.textContent = options.header;
        s(h2, { color: 'var(--header-primary, #fff)', marginBottom: '12px' });
        header.appendChild(h2);
      } else if (options.header instanceof HTMLElement) {
        header.appendChild(options.header);
      } else {
        const w = div();
        header.appendChild(w);
        try {
          if (BdApi.ReactDOM.createRoot) { BdApi.ReactDOM.createRoot(w).render(options.header); }
          else { BdApi.ReactDOM.render(options.header, w); }
        } catch(e) { console.error('[messageloggerfix] header render error', e); }
      }
    }
    panel.appendChild(header);

    // Body
    const body = s(div('mlf-modal-body'), {
      flex: '1', overflowY: 'auto', overflowX: 'hidden',
      padding: '0', paddingTop: '16px', minHeight: '300px'
    });
    if (options.children) {
      const kids = Array.isArray(options.children) ? options.children : [options.children];
      for (const child of kids) {
        if (child instanceof HTMLElement) body.appendChild(child);
        else if (child) {
          const w = div();
          body.appendChild(w);
          try {
            if (BdApi.ReactDOM.createRoot) { BdApi.ReactDOM.createRoot(w).render(child); }
            else { BdApi.ReactDOM.render(child, w); }
          } catch(e) { console.error('[messageloggerfix] body render error', e); }
        }
      }
    }
    panel.appendChild(body);

    // Footer
    const footer = s(div('mlf-modal-footer'), {
      padding: '12px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderTop: '1px solid rgba(212,175,55,0.12)',
      flexShrink: '0',
      background: 'rgba(13,10,26,0.5)'
    });

    // Left side buttons
    const footerLeft = s(div(), { display: 'flex', gap: '8px', alignItems: 'center' });
    if (options.cancelText) {
      const sortBtn = btn(options.cancelText, {
        background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
        color: '#d4af37', cursor: 'pointer',
        padding: '8px 16px', borderRadius: '4px',
        fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease'
      });
      sortBtn.onmouseenter = () => { sortBtn.style.background = 'rgba(212,175,55,0.18)'; sortBtn.style.boxShadow = '0 0 10px rgba(212,175,55,0.15)'; };
      sortBtn.onmouseleave = () => { sortBtn.style.background = 'rgba(212,175,55,0.08)'; sortBtn.style.boxShadow = 'none'; };
      sortBtn.onclick = e => { if (options.onCancel) options.onCancel(e); };
      footerLeft.appendChild(sortBtn);
    }

    // Export button
    const exportBtn = btn('\u2728 𝐞𝗑𝗉𝐨𝗋𝗍', {
      background: 'linear-gradient(135deg, #d4af37 0%, #c5981e 100%)', border: 'none',
      color: '#0d0a1a', cursor: 'pointer',
      padding: '8px 16px', borderRadius: '4px',
      fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease',
      boxShadow: '0 0 10px rgba(212,175,55,0.2)'
    });
    exportBtn.onmouseenter = () => { exportBtn.style.boxShadow = '0 0 20px rgba(212,175,55,0.4)'; };
    exportBtn.onmouseleave = () => { exportBtn.style.boxShadow = '0 0 10px rgba(212,175,55,0.2)'; };
    exportBtn.onclick = () => { this.showExportModal(); };
    footerLeft.appendChild(exportBtn);

    // Manage lists button
    const manageBtn = btn('\u2699\ufe0f', {
      background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
      color: '#d4af37', cursor: 'pointer',
      padding: '8px 14px', borderRadius: '4px',
      fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease'
    });
    manageBtn.onmouseenter = () => { manageBtn.style.background = 'rgba(212,175,55,0.18)'; manageBtn.style.boxShadow = '0 0 10px rgba(212,175,55,0.15)'; };
    manageBtn.onmouseleave = () => { manageBtn.style.background = 'rgba(212,175,55,0.08)'; manageBtn.style.boxShadow = 'none'; };
    manageBtn.onclick = () => { this.showManageListsModal(); };
    new ZeresPluginLibrary.Tooltip(manageBtn, 'Manage whitelist/blacklist', { side: 'top' });
    footerLeft.appendChild(manageBtn);

    footer.appendChild(footerLeft);

    // Right side buttons
    const footerRight = s(div(), { display: 'flex', gap: '8px', alignItems: 'center' });
    if (options.confirmText) {
      const clearBtn = btn(options.confirmText, {
        background: 'rgba(220,60,60,0.15)', border: '1px solid rgba(220,60,60,0.3)',
        color: '#f04747', cursor: 'pointer',
        padding: '8px 16px', borderRadius: '4px',
        fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease'
      });
      clearBtn.onmouseenter = () => { clearBtn.style.background = 'rgba(220,60,60,0.25)'; clearBtn.style.boxShadow = '0 0 10px rgba(220,60,60,0.2)'; };
      clearBtn.onmouseleave = () => { clearBtn.style.background = 'rgba(220,60,60,0.15)'; clearBtn.style.boxShadow = 'none'; };
      clearBtn.onclick = e => { if (options.onConfirm) options.onConfirm(e); };
      footerRight.appendChild(clearBtn);
    }
    footer.appendChild(footerRight);
    panel.appendChild(footer);

    overlay.appendChild(panel);

    // Escape to close
    const escHandler = e => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);

    document.body.appendChild(overlay);
  }
  getMessageAny(id) {
    const record = this.messageRecord[id];
    if (!record) return this.cachedMessageRecord.find(m => m.id == id);
    return record.message;
  }
  async cacheImage(url, attachmentIdx, attachmentId, messageId, channelId, attempts = 0) {
    const res = await fetch(url);
    if (res.status != 200) {
      if (res.status == 404 || res.status == 403) return;
      attempts++;
      if (attempts > 3) return ZeresPluginLibrary.Logger.warn(this.getName(), `Failed to get image ${attachmentId} for caching, error code ${res.status}`);
      return setTimeout(() => this.cacheImage(url, attachmentIdx, attachmentId, messageId, channelId, attempts), 1000);
    }
    const fileExtension = url.match(/(\.[0-9a-z]+)(?:$|\?)/i)[1];
    const ab = await res.arrayBuffer();
    this.nodeModules.fs.writeFileSync(`${this.settings.imageCacheDir}/${attachmentId}${fileExtension}`, Buffer.from(ab));
  }
  cacheMessageImages(message) {
    // don't block it, ugly but works, might rework later
    setTimeout(() => {
      for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];
        if (!this.isImage(attachment.url)) continue;
        this.cacheImage(attachment.url, i, attachment.id, message.id, message.channel_id);
      }
    }, 0);
  }
  /* ==================================================-|| END MISC ||-================================================== */
  /* ==================================================-|| START MESSAGE MANAGMENT ||-================================================== */
  deleteMessageFromRecords(id) {
    const record = this.messageRecord[id];
    if (!record) {
      for (let map of [this.deletedMessageRecord, this.editedMessageRecord, this.purgedMessageRecord]) {
        for (let channelId in map) {
          const index = map[channelId].findIndex(m => m === id);
          if (index == -1) continue;
          map[channelId].splice(index, 1);
          if (!map[channelId].length) delete map[channelId];
        }
      }
      return;
    }
    // console.log('Deleting', record);
    const channelId = record.message.channel_id;
    for (let map of [this.deletedMessageRecord, this.editedMessageRecord, this.purgedMessageRecord]) {
      if (!map[channelId]) continue;
      const index = map[channelId].findIndex(m => m === id);
      if (index == -1) continue;
      map[channelId].splice(index, 1);
      if (!map[channelId].length) delete map[channelId];
    }
    delete this.messageRecord[id];
  }
  handleMessagesCap() {
    try {
      // TODO: add empty record and infinite loop checking for speed improvements
      const extractAllMessageIds = map => {
        let ret = [];
        for (let channelId in map) {
          for (let messageId of map[channelId]) {
            ret.push(messageId);
          }
        }
        return ret;
      };
      if (this.cachedMessageRecord.length > this.settings.messageCacheCap) this.cachedMessageRecord.splice(0, this.cachedMessageRecord.length - this.settings.messageCacheCap);
      let changed = false;
      const deleteMessages = map => {
        this.sortMessagesByAge(map);
        const toDelete = map.length - this.settings.savedMessagesCap;
        for (let i = map.length - 1, deleted = 0; i >= 0 && deleted != toDelete; i--, deleted++) {
          this.deleteMessageFromRecords(map[i]);
        }
        changed = true;
      };
      const handleInvalidEntries = map => {
        for (let channelId in map) {
          for (let messageIdIdx = map[channelId].length - 1; messageIdIdx >= 0; messageIdIdx--) {
            if (!Array.isArray(map[channelId])) {
              delete map[channelId];
              changed = true;
              continue;
            }
            if (!this.messageRecord[map[channelId][messageIdIdx]]) {
              map[channelId].splice(messageIdIdx, 1);
              changed = true;
            }
          }
          if (!map[channelId].length) {
            delete map[channelId];
            changed = true;
          }
        }
      };
      for (let map of [this.deletedMessageRecord, this.editedMessageRecord, this.purgedMessageRecord]) handleInvalidEntries(map);
      // I have no idea how to optimize this, HELP!
      //const checkIsInRecords = (channelId, messageId) => {
      //  // for (let map of [this.deletedMessageRecord, this.editedMessageRecord, this.purgedMessageRecord]) if (map[channelId] && map[channelId].indexOf(messageId) !== -1) return true;
      //  let map = this.deletedMessageRecord[channelId];
      //  if (map && map.indexOf(messageId) !== -1) return true;
      //  map = this.editedMessageRecord[channelId];
      //  if (map && map.indexOf(messageId) !== -1) return true;
      //  map = this.purgedMessageRecord[channelId];
      //  if (map && map.indexOf(messageId) !== -1) return true;
      //  return false;
      //};

      //for (const messageId in this.messageRecord) {
      //  if (!checkIsInRecords(this.messageRecord[messageId].message.channel_id, messageId)) {/*  delete this.messageRecord[messageId]; */ }
      //}
      let deletedMessages = extractAllMessageIds(this.deletedMessageRecord);
      let editedMessages = extractAllMessageIds(this.editedMessageRecord);
      let purgedMessages = extractAllMessageIds(this.purgedMessageRecord);
      for (let map of [deletedMessages, editedMessages, purgedMessages]) if (map.length > this.settings.savedMessagesCap) deleteMessages(map);
      if (changed) this.saveData();
      if (!this.settings.cacheAllImages) return;
      if (!this.settings.dontDeleteCachedImages) {
        const savedImages = this.nodeModules.fs.readdirSync(this.settings.imageCacheDir);
        const msgs = Object.values(this.messageRecord)
          .filter(e => e.delete_data)
          .map(({ message: { attachments } }) => attachments)
          .filter(e => e.length);
        for (let img of savedImages) {
          const [attId] = img.split('.');
          if (isNaN(attId)) continue;
          let found = false;
          for (let i = 0, len = msgs.length; i < len; i++) {
            if (msgs[i].findIndex(({ id }) => id === attId) !== -1) {
              found = true;
              break;
            }
          }
          if (found) continue;
          this.nodeModules.fs.unlink(`${this.settings.imageCacheDir}/${img}`, e => e && ZeresPluginLibrary.Logger.err(this.getName(), 'Error deleting unreferenced image, what the shit', e.message));
        }
      }
      // 10 minutes
      for (let id in this.editHistoryAntiSpam) if (new Date().getTime() - this.editHistoryAntiSpam[id].times[0] < 10 * 60 * 1000) delete this.editHistoryAntiSpam[id];
    } catch (e) {
      ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Error clearing out data', e);
    }
  }
  /* ==================================================-|| END MESSAGE MANAGMENT ||-================================================== */
  onDispatchEvent(args, callDefault) {
    const dispatch = args[0];
    let ret = Promise.resolve();

    if (!dispatch) return callDefault(...args);

    try {
      if (dispatch.type === 'MESSAGE_LOG_SELF_TEST') {
        clearTimeout(this.selfTestTimeout);
        //console.log('Self test OK');
        this.selfTestFailures = 0;
        return ret;
      }
      // if (dispatch.type == 'EXPERIMENT_TRIGGER') return callDefault(...args);
      // console.log('INFO: onDispatchEvent -> dispatch', dispatch);
      if (dispatch.type === 'CHANNEL_SELECT') {
        ret = callDefault(...args);
        this.selectedChannel = this.getSelectedTextChannel();
        return ret;
      }

      if (dispatch.ML && dispatch.type === 'MESSAGE_DELETE') return callDefault(...args);

      if (dispatch.type !== 'MESSAGE_CREATE' && dispatch.type !== 'MESSAGE_DELETE' && dispatch.type !== 'MESSAGE_DELETE_BULK' && dispatch.type !== 'MESSAGE_UPDATE' && dispatch.type !== 'LOAD_MESSAGES_SUCCESS') return callDefault(...args);

      // console.log('INFO: onDispatchEvent -> dispatch', dispatch);

      if (dispatch.message && (dispatch.message.type !== 0 && dispatch.message.type !== 19 && (dispatch.message.type !== 20 || (dispatch.message.flags & 64) === 64))) return callDefault(...args); // anti other shit 1

      const channel = this.tools.getChannel(dispatch.message ? dispatch.message.channel_id : dispatch.channelId);
      if (!channel) return callDefault(...args);
      const guild = channel.guild_id ? this.tools.getServer(channel.guild_id) : false;

      let author = dispatch.message && dispatch.message.author ? this.tools.getUser(dispatch.message.author.id) : false;
      if (!author) author = (this.channelMessages[channel.id]?.get(dispatch.message?.id || dispatch.id) || {}).author;
      if (!author) {
        // last ditch attempt
        let message = this.getCachedMessage(dispatch.message?.id || dispatch.id, channel.id);
        if (message) author = this.tools.getUser(message.author.id);
      }

      if (!author && !(dispatch.type == 'LOAD_MESSAGES_SUCCESS' || dispatch.type == 'MESSAGE_DELETE_BULK')) return callDefault(...args);

      const isLocalUser = author && author.id === this.localUser.id;

      if (author && author.bot && this.settings.ignoreBots) return callDefault(...args);
      if (author && isLocalUser && this.settings.ignoreSelf) return callDefault(...args);
      if (author && this.settings.ignoreBlockedUsers && this.tools.isBlocked(author.id) && !isLocalUser) return callDefault(...args);
      if (author && author.avatar === 'clyde') return callDefault(...args);

      if (this.settings.ignoreLocalEdits && dispatch.type === 'MESSAGE_UPDATE' && isLocalUser) return callDefault(...args);
      if (this.settings.ignoreLocalDeletes && dispatch.type === 'MESSAGE_DELETE' && isLocalUser && this.localDeletes.findIndex(m => m === dispatch.id) !== -1) return callDefault(...args);

      let guildIsMutedReturn = false;
      let channelIgnoreReturn = false;

      const isInWhitelist = id => this.settings.whitelist.findIndex(m => m === id) != -1;
      const isInBlacklist = id => this.settings.blacklist.findIndex(m => m === id) != -1;
      const guildWhitelisted = guild && isInWhitelist(guild.id);
      const channelWhitelisted = isInWhitelist(channel.id);

      const guildBlacklisted = guild && isInBlacklist(guild.id);
      const channelBlacklisted = isInBlacklist(channel.id);

      let doReturn = false;

      if (guild) {
        guildIsMutedReturn = this.settings.ignoreMutedGuilds && this.muteModule.isMuted(guild.id);
        channelIgnoreReturn = (this.settings.ignoreNSFW && channel.nsfw && !channelWhitelisted) || (this.settings.ignoreMutedChannels && (this.muteModule.isChannelMuted(guild.id, channel.id) || (channel.parent_id && this.muteModule.isChannelMuted(guild.id, channel.parent_id))));
      }

      if (!((this.settings.alwaysLogSelected && this.selectedChannel && this.selectedChannel.id == channel.id) || (this.settings.alwaysLogDM && !guild))) {
        if (guildBlacklisted) {
          if (!channelWhitelisted) doReturn = true; // not whitelisted
        } else if (guildWhitelisted) {
          if (channelBlacklisted) doReturn = true; // channel blacklisted
          if (channelIgnoreReturn && !channelWhitelisted) doReturn = true;
        } else {
          if (this.settings.onlyLogWhitelist) {
            if (!channelWhitelisted) doReturn = true; // guild not in either list, channel not whitelisted
          } else {
            if (channelBlacklisted) doReturn = true; // channel blacklisted
            if (channelIgnoreReturn || guildIsMutedReturn) {
              if (!channelWhitelisted) doReturn = true;
            }
          }
        }
      }

      if (doReturn && this.settings.alwaysLogGhostPings) {
        if (dispatch.type === 'MESSAGE_DELETE') {
          const deleted = (this.tempEditedMessageRecord[dispatch.id] && this.tempEditedMessageRecord[dispatch.id].message) || this.getCachedMessage(dispatch.id, dispatch.channelId);
          if (!deleted || (deleted.type !== 0 && deleted.type !== 19 && deleted.type !== 20)) return callDefault(...args); // nothing we can do past this point..
          if (!this.tools.isMentioned(deleted, this.localUser.id)) return callDefault(...args);
          const record = this.messageRecord[dispatch.id];
          if ((!this.selectedChannel || this.selectedChannel.id != channel.id) && (guild ? this.settings.toastToggles.ghostPings : this.settings.toastTogglesDMs.ghostPings) && (!record || !record.ghost_pinged)) {
            XenoLib.Notifications.warning(`You got ghost pinged in ${this.getLiteralName(channel.guild_id, channel.id, true)}`, { timeout: 0, onClick: () => this.openWindow('ghostpings'), onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id), channelId: channel.id });
            if (!this.settings.useNotificationsInstead) {
              this.showToast(`You got ghost pinged in ${this.getLiteralName(channel.guild_id, channel.id)}`, {
                type: 'warning',
                onClick: () => this.openWindow('ghostpings'),
                onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id),
                timeout: 4500
              });
            }
          }
          this.saveDeletedMessage(deleted, this.deletedMessageRecord);
          this.saveData();
          if (XenoLib.DiscordAPI.channelId.id === dispatch.channelId) this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE', id: dispatch.id });
        } else if (dispatch.type === 'MESSAGE_UPDATE') {
          if (!dispatch.message.edited_timestamp) {
            if (dispatch.message.embeds) {
              let last = this.getCachedMessage(dispatch.message.id);
              if (last) last.embeds = dispatch.message.embeds.map(this.cleanupEmbed);
            }
            return callDefault(...args);
          }
          let isSaved = this.getEditedMessage(dispatch.message.id, channel.id);
          const last = this.getCachedMessage(dispatch.message.id, channel.id);
          const lastEditedSaved = isSaved || this.tempEditedMessageRecord[dispatch.message.id];
          // if we have lastEdited then we can still continue as we have all the data we need to process it.
          if (!last && !lastEditedSaved) return callDefault(...args); // nothing we can do past this point..

          if (lastEditedSaved && !lastEditedSaved.message.edited_timestamp) lastEditedSaved.message.edited_timestamp = dispatch.message.edited_timestamp;

          if (isSaved && !lastEditedSaved.local_mentioned) {
            lastEditedSaved.message.content = dispatch.message.content; // don't save history, just the value so we don't confuse the user
            return callDefault(...args);
          }

          let ghostPinged = false;
          if (lastEditedSaved) {
            // last is not needed, we have all the data already saved
            if (lastEditedSaved.message.content === dispatch.message.content) return callDefault(...args); // we don't care about that
            lastEditedSaved.edit_history.push({
              content: lastEditedSaved.message.content,
              time: new Date().getTime()
            });
            lastEditedSaved.message.content = dispatch.message.content;
            ghostPinged = !lastEditedSaved.ghost_pinged && lastEditedSaved.local_mentioned && !this.tools.isMentioned(dispatch.message, this.localUser.id);
          } else {
            if (last.content === dispatch.message.content) return callDefault(...args); // we don't care about that
            let data = this.createMiniFormattedData(last);
            data.edit_history = [
              {
                content: last.content,
                time: new Date().getTime()
              }
            ];
            data.message.content = dispatch.message.content;
            this.tempEditedMessageRecord[data.message.id] = data;
            ghostPinged = this.tools.isMentioned(last, this.localUser.id) && !this.tools.isMentioned(dispatch.message, this.localUser.id);
          }

          if (isSaved) this.saveData();

          if (!ghostPinged) return callDefault(...args);

          if (!isSaved) {
            const data = this.tempEditedMessageRecord[dispatch.message.id];
            data.ghost_pinged = true;
            this.messageRecord[dispatch.message.id] = data;
            if (!this.editedMessageRecord[channel.id]) this.editedMessageRecord[channel.id] = [];
            this.editedMessageRecord[channel.id].push(dispatch.message.id);
            this.saveData();
          } else {
            const lastEdited = this.getEditedMessage(dispatch.message.id, channel.id);
            if (!lastEdited) return callDefault(...args);
            lastEdited.ghost_pinged = true;
            this.saveData();
          }

          if ((!this.selectedChannel || this.selectedChannel.id != channel.id) && (guild ? this.settings.toastToggles.ghostPings : this.settings.toastTogglesDMs.ghostPings)) {
            XenoLib.Notifications.warning(`You got ghost pinged in ${this.getLiteralName(channel.guild_id, channel.id, true)}`, { timeout: 0, onClick: () => this.openWindow('ghostpings'), onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id), channelId: channel.id });
            if (!this.settings.useNotificationsInstead) {
              this.showToast(`You got ghost pinged in ${this.getLiteralName(channel.guild_id, channel.id)}`, {
                type: 'warning',
                onClick: () => this.openWindow('ghostpings'),
                onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id),
                timeout: 4500
              });
            }
          }
        } else if (dispatch.type == 'MESSAGE_CREATE' && dispatch.message && (dispatch.message.content.length || (dispatch.message.attachments && dispatch.message.attachments.length) || (dispatch.message.embeds && dispatch.message.embeds.length)) && dispatch.message.state != 'SENDING' && !dispatch.optimistic && (dispatch.message.type === 0 || dispatch.message.type === 19 || dispatch.message.type === 20) && this.tools.isMentioned(dispatch.message, this.localUser.id)) {
          if (this.cachedMessageRecord.findIndex(m => m.id === dispatch.message.id) != -1) return callDefault(...args);
          this.cachedMessageRecord.push(dispatch.message);
        }
      }
      if (doReturn) return callDefault(...args);

      if (dispatch.type == 'LOAD_MESSAGES_SUCCESS') {
        if (!this.settings.restoreDeletedMessages) return callDefault(...args);
        if (dispatch.jump && dispatch.jump.ML) delete dispatch.jump;
        const deletedMessages = this.deletedMessageRecord[channel.id];
        const purgedMessages = this.purgedMessageRecord[channel.id];
        try {
          const recordIDs = [...(deletedMessages || []), ...(purgedMessages || [])];
          const fetchUser = id => this.tools.getUser(id) || dispatch.messages.find(e => e.author.id === id)
          for (let i = 0, len = recordIDs.length; i < len; i++) {
            const id = recordIDs[i];
            if (!this.messageRecord[id]) continue;
            const { message } = this.messageRecord[id];
            for (let j = 0, len2 = message.mentions.length; j < len2; j++) {
              const user = message.mentions[j];
              const cachedUser = fetchUser(user.id || user);
              if (cachedUser) message.mentions[j] = this.cleanupUserObject(cachedUser);
            }
            const author = fetchUser(message.author.id);
            if (!author) continue;
            message.author = this.cleanupUserObject(author);
          }
        } catch { }
        if ((!deletedMessages && !purgedMessages) || (!this.settings.showPurgedMessages && !this.settings.showDeletedMessages)) return callDefault(...args);
        if (this.settings.showDeletedMessages && deletedMessages) this.reAddDeletedMessages(dispatch.messages, deletedMessages, !dispatch.hasMoreAfter && !dispatch.isBefore, !dispatch.hasMoreBefore && !dispatch.isAfter);
        if (this.settings.showPurgedMessages && purgedMessages) this.reAddDeletedMessages(dispatch.messages, purgedMessages, !dispatch.hasMoreAfter && !dispatch.isBefore, !dispatch.hasMoreBefore && !dispatch.isAfter);
        return callDefault(...args);
      }

      const notificationsBlacklisted = this.settings.notificationBlacklist.indexOf(channel.id) !== -1 || (guild && this.settings.notificationBlacklist.indexOf(guild.id) !== -1);

      if (dispatch.type == 'MESSAGE_DELETE') {
        const deleted = this.getCachedMessage(dispatch.id, dispatch.channelId);

        if (this.settings.aggresiveMessageCaching) {
          const channelMessages = this.channelMessages[channel.id];
          if (!channelMessages || !channelMessages.ready) this.cacheChannelMessages(channel.id);
        }

        if (!deleted) return callDefault(...args); // nothing we can do past this point..

        if (this.deletedMessageRecord[channel.id] && this.deletedMessageRecord[channel.id].findIndex(m => m === deleted.id) != -1) {
          if (!this.settings.showDeletedMessages) ret = callDefault(...args);
          return ret;
        }

        if (deleted.type !== 0 && deleted.type !== 19 && (deleted.type !== 20 || (deleted.flags & 64) === 64)) return callDefault(...args);

        if (this.settings.showDeletedCount) {
          if (!this.deletedChatMessagesCount[channel.id]) this.deletedChatMessagesCount[channel.id] = 0;
          if (!this.selectedChannel || this.selectedChannel.id != channel.id) this.deletedChatMessagesCount[channel.id]++;
        }
        if (!notificationsBlacklisted) {
          if (guild ? this.settings.toastToggles.deleted && ((isLocalUser && !this.settings.toastToggles.disableToastsForLocal) || !isLocalUser) : this.settings.toastTogglesDMs.deleted && !isLocalUser) {
            if (this.settings.useNotificationsInstead) {
              XenoLib.Notifications.danger(`Message deleted from ${this.getLiteralName(channel.guild_id, channel.id, true)}`, {
                onClick: () => this.openWindow('deleted'),
                onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id),
                timeout: 4500
              });
            } else {
              this.showToast(`Message deleted from ${this.getLiteralName(channel.guild_id, channel.id)}`, {
                type: 'error',
                onClick: () => this.openWindow('deleted'),
                onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id),
                timeout: 4500
              });
            }
          }
        }

        const record = this.messageRecord[dispatch.id];

        if ((!this.selectedChannel || this.selectedChannel.id != channel.id) && (guild ? this.settings.toastToggles.ghostPings : this.settings.toastTogglesDMs.ghostPings) && (!record || !record.ghost_pinged) && this.tools.isMentioned(deleted, this.localUser.id)) {
          XenoLib.Notifications.warning(`You got ghost pinged in ${this.getLiteralName(channel.guild_id, channel.id, true)}`, { timeout: 0, onClick: () => this.openWindow('ghostpings'), onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id), channelId: dispatch.channelId });
          if (!this.settings.useNotificationsInstead) {
            this.showToast(`You got ghost pinged in ${this.getLiteralName(channel.guild_id, channel.id)}`, {
              type: 'warning',
              onClick: () => this.openWindow('ghostpings'),
              onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id),
              timeout: 4500
            });
          }
        }

        this.saveDeletedMessage(deleted, this.deletedMessageRecord);
        // if (this.settings.cacheAllImages) this.cacheImages(deleted);
        if (!this.settings.showDeletedMessages) ret = callDefault(...args);
        else if (XenoLib.DiscordAPI.channelId === dispatch.channelId) this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE', id: dispatch.id });
        this.saveData();
      } else if (dispatch.type == 'MESSAGE_DELETE_BULK') {
        if (this.settings.showDeletedCount) {
          if (!this.deletedChatMessagesCount[channel.id]) this.deletedChatMessagesCount[channel.id] = 0;
          if (!this.selectedChannel || this.selectedChannel.id != channel.id) this.deletedChatMessagesCount[channel.id] += dispatch.ids.length;
        }

        let failedMessage = false;

        for (let i = 0; i < dispatch.ids.length; i++) {
          const purged = this.getCachedMessage(dispatch.ids[i], channel.id);
          if (!purged) {
            failedMessage = true;
            continue;
          }
          this.saveDeletedMessage(purged, this.purgedMessageRecord);
          if (XenoLib.DiscordAPI.channelId === dispatch.channelId) this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE', id: purged.id });
        }

        if (failedMessage && this.aggresiveMessageCaching)
          // forcefully cache the channel in case there are active convos there
          this.cacheChannelMessages(channel.id);
        else if (this.settings.aggresiveMessageCaching) {
          const channelMessages = this.channelMessages[channel.id];
          if (!channelMessages || !channelMessages.ready) this.cacheChannelMessages(channel.id);
        }
        if (!notificationsBlacklisted) {
          if (guild ? this.settings.toastToggles.deleted : this.settings.toastTogglesDMs.deleted) {
            if (this.settings.useNotificationsInstead) {
              XenoLib.Notifications.danger(`${dispatch.ids.length} messages bulk deleted from ${this.getLiteralName(channel.guild_id, channel.id, true)}`, {
                onClick: () => this.openWindow('purged'),
                onContext: () => this.jumpToMessage(channel.id, undefined, guild && guild.id),
                timeout: 4500
              });
            } else {
              this.showToast(`${dispatch.ids.length} messages bulk deleted from ${this.getLiteralName(channel.guild_id, channel.id)}`, {
                type: 'error',
                onClick: () => this.openWindow('purged'),
                onContext: () => this.jumpToMessage(channel.id, undefined, guild && guild.id),
                timeout: 4500
              });
            }
          }
        }
        if (!this.settings.showPurgedMessages) ret = callDefault(...args);
        this.saveData();
      } else if (dispatch.type == 'MESSAGE_UPDATE') {
        if (!dispatch.message.edited_timestamp) {
          if (dispatch.message.embeds) {
            let last = this.getCachedMessage(dispatch.message.id);
            if (last) last.embeds = dispatch.message.embeds.map(this.cleanupEmbed);
          }
          return callDefault(...args);
        }

        if (this.settings.showEditedCount) {
          if (!this.editedChatMessagesCount[channel.id]) this.editedChatMessagesCount[channel.id] = 0;
          if (!this.selectedChannel || this.selectedChannel.id != channel.id) this.editedChatMessagesCount[channel.id]++;
        }

        if (this.settings.aggresiveMessageCaching) {
          const channelMessages = this.channelMessages[channel.id];
          if (!channelMessages || !channelMessages.ready) this.cacheChannelMessages(channel.id);
        }

        const last = this.getCachedMessage(dispatch.message.id, channel.id);
        const lastEditedSaved = this.getEditedMessage(dispatch.message.id, channel.id);

        if (lastEditedSaved && !lastEditedSaved.message.edited_timestamp) lastEditedSaved.message.edited_timestamp = dispatch.message.edited_timestamp;

        // if we have lastEdited then we can still continue as we have all the data we need to process it.
        if (!last && !lastEditedSaved) return callDefault(...args); // nothing we can do past this point..
        let ghostPinged = false;
        if (lastEditedSaved) {
          // last is not needed, we have all the data already saved
          // console.log(lastEditedSaved.message);
          // console.log(dispatch.message);
          if (lastEditedSaved.message.content === dispatch.message.content) {
            return callDefault(...args); // we don't care about that
          }
          lastEditedSaved.edit_history.push({
            content: lastEditedSaved.message.content,
            time: new Date().getTime()
          });
          lastEditedSaved.message.content = dispatch.message.content;
          ghostPinged = !lastEditedSaved.ghost_pinged && lastEditedSaved.local_mentioned && !this.tools.isMentioned(dispatch.message, this.localUser.id);
          if (ghostPinged) lastEditedSaved.ghost_pinged = true;
        } else {
          if (last.content === dispatch.message.content) {
            return callDefault(...args); // we don't care about that
          }
          let data = this.createMiniFormattedData(last);
          data.edit_history = [
            {
              content: last.content,
              time: new Date().getTime()
            }
          ];
          ghostPinged = this.tools.isMentioned(last, this.localUser.id) && !this.tools.isMentioned(dispatch.message, this.localUser.id);
          data.message.content = dispatch.message.content;
          if (ghostPinged) data.ghost_pinged = true;
          this.messageRecord[data.message.id] = data;
          if (!this.editedMessageRecord[channel.id]) this.editedMessageRecord[channel.id] = [];
          this.editedMessageRecord[channel.id].push(data.message.id);
        }
        if (!notificationsBlacklisted) {
          if (guild ? this.settings.toastToggles.edited && ((isLocalUser && !this.settings.toastToggles.disableToastsForLocal) || !isLocalUser) : this.settings.toastTogglesDMs.edited && !isLocalUser) {
            if (!this.settings.blockSpamEdit) {
              if (!this.editHistoryAntiSpam[author.id]) {
                this.editHistoryAntiSpam[author.id] = {
                  blocked: false,
                  times: [new Date().getTime()]
                };
              } else {
                this.editHistoryAntiSpam[author.id].times.push(new Date().getTime());
              }
              if (this.editHistoryAntiSpam[author.id].times.length > 10) this.editHistoryAntiSpam[author.id].times.shift();
              if (this.editHistoryAntiSpam[author.id].times.length === 10 && new Date().getTime() - this.editHistoryAntiSpam[author.id].times[0] < 60 * 1000) {
                if (!this.editHistoryAntiSpam[author.id].blocked) {
                  if (this.settings.useNotificationsInstead) {
                    XenoLib.Notifications.warning(`Edit notifications from <@${author.id}> have been temporarily blocked for 1 minute.`, {
                      timeout: 7500,
                      channelId: channel.id
                    });
                  } else {
                    this.showToast(`Edit notifications from ${author.username} have been temporarily blocked for 1 minute.`, {
                      type: 'warning',
                      timeout: 7500
                    });
                  }
                  this.editHistoryAntiSpam[author.id].blocked = true;
                }
              } else if (this.editHistoryAntiSpam[author.id].blocked) {
                this.editHistoryAntiSpam[author.id].blocked = false;
                this.editHistoryAntiSpam[author.id].times = [];
              }
            }
            if (this.settings.blockSpamEdit || !this.editHistoryAntiSpam[author.id].blocked) {
              if (this.settings.useNotificationsInstead) {
                XenoLib.Notifications.info(`Message edited in ${this.getLiteralName(channel.guild_id, channel.id, true)}`, {
                  onClick: () => this.openWindow('edited'),
                  onContext: () => this.jumpToMessage(channel.id, dispatch.message.id, guild && guild.id),
                  timeout: 4500
                });
              } else {
                this.showToast(`Message edited in ${this.getLiteralName(channel.guild_id, channel.id)}`, {
                  type: 'info',
                  onClick: () => this.openWindow('edited'),
                  onContext: () => this.jumpToMessage(channel.id, dispatch.message.id, guild && guild.id),
                  timeout: 4500
                });
              }
            }
          }
        }
        if ((!this.selectedChannel || this.selectedChannel.id != channel.id) && (guild ? this.settings.toastToggles.ghostPings : this.settings.toastTogglesDMs.ghostPings) && ghostPinged) {
          XenoLib.Notifications.warning(`You got ghost pinged in ${this.getLiteralName(channel.guild_id, channel.id, true)}`, { timeout: 0, onClick: () => this.openWindow('ghostpings'), onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id), channelId: dispatch.channelId });
          if (!this.settings.useNotificationsInstead) {
            this.showToast(`You got ghost pinged in ${this.getLiteralName(channel.guild_id, channel.id)}`, {
              type: 'warning',
              onClick: () => this.openWindow('ghostpings'),
              onContext: () => this.jumpToMessage(dispatch.channelId, dispatch.id, guild && guild.id),
              timeout: 4500
            });
          }
        }
        this.saveData();
        return callDefault(...args);
      } else if (dispatch.type == 'MESSAGE_CREATE' && dispatch.message && (dispatch.message.content.length || (dispatch.message.attachments && dispatch.message.attachments.length) || (dispatch.message.embeds && dispatch.message.embeds.length)) && dispatch.message.state != 'SENDING' && !dispatch.optimistic && (dispatch.message.type === 0 || dispatch.message.type === 19 || dispatch.message.type === 20)) {
        if (this.cachedMessageRecord.findIndex(m => m.id === dispatch.message.id) != -1) return callDefault(...args);
        this.cachedMessageRecord.push(dispatch.message);

        /* if (this.menu.open && this.menu.selectedTab == 'sent') this.refilterMessages(); */

        if (this.settings.aggresiveMessageCaching) {
          const channelMessages = this.channelMessages[channel.id];
          if (!channelMessages || !channelMessages.ready) this.cacheChannelMessages(channel.id);
        }
        if (!notificationsBlacklisted) {
          if ((guild ? this.settings.toastToggles.sent : this.settings.toastTogglesDMs.sent) && (!this.selectedChannel || this.selectedChannel.id != channel.id)) {
            if (this.settings.useNotificationsInstead) {
              XenoLib.Notifications.info(`Message sent in ${this.getLiteralName(channel.guild_id, channel.id, true)}`, { onClick: () => this.openWindow('sent'), onContext: () => this.jumpToMessage(channel.id, dispatch.message.id, guild && guild.id), timeout: 4500 });
            } else {
              this.showToast(`Message sent in ${this.getLiteralName(channel.guild_id, channel.id)}`, { type: 'info', onClick: () => this.openWindow('sent'), onContext: () => this.jumpToMessage(channel.id, dispatch.message.id, guild && guild.id), timeout: 4500 });
            }
          }
        }
        return callDefault(...args);
      } else return callDefault(...args);
    } catch (err) {
      ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Error in onDispatchEvent', err);
    }
    return ret;
  }
  /* ==================================================-|| START MENU ||-================================================== */
  processUserRequestQueue() {
    return;
    if (!this.processUserRequestQueue.queueIntervalTime) this.processUserRequestQueue.queueIntervalTime = 500;
    if (this.menu.queueInterval) return;
    const messageDataManager = () => {
      return;
      if (!this.menu.userRequestQueue.length) {
        clearInterval(this.menu.queueInterval);
        this.menu.queueInterval = 0;
        return;
      }
      const data = this.menu.userRequestQueue.shift();
      this.tools
        .getUserAsync(data.id)
        .then(res => {
          for (let ss of data.success) ss(res);
        })
        .catch(reason => {
          if (reason.status == 429 && typeof reason.body.retry_after === 'number') {
            clearInterval(this.menu.queueInterval);
            this.menu.queueInterval = 0;
            this.processUserRequestQueue.queueIntervalTime += 50;
            setTimeout(messageDataManager, reason.body.retry_after);
            ZeresPluginLibrary.Logger.warn(this.getName(), 'Rate limited, retrying in', reason.body.retry_after, 'ms');
            this.menu.userRequestQueue.push(data);
            return;
          }
          ZeresPluginLibrary.Logger.warn(this.getName(), `Failed to get info for ${data.username}, reason:`, reason);
          for (let ff of data.fail) ff();
        });
    };
    this.menu.queueInterval = setInterval(messageDataManager, this.processUserRequestQueue.queueIntervalTime);
  }
  getReactInstance(node) {
    const domNode = ZeresPluginLibrary.DOMTools.resolveElement(node);
    if (!(domNode instanceof Element)) return undefined;
    return domNode[Object.keys(domNode).find((key) => key.startsWith("__reactInternalInstance") || key.startsWith("__reactFiber") || key.startsWith("__reactContainer"))];
  }
  async patchMessages() {
    const Tooltip = (() => {
      let ret = null;
      ZeresPluginLibrary.WebpackModules.getModule(e => {
        for (const val of Object.values(e)) {
          if (typeof val !== 'function') continue;
          if (val.Colors && val.prototype?.shouldShowTooltip) {
            ret = val;
            return true;
          }
        }
        return false;
      })
      return ret;
    })();
    const dateFormat = ZeresPluginLibrary.WebpackModules.getModule(e => typeof e === 'function' && e?.toString()?.includes('sameDay'), { searchExports: true });
    //const i18n = ZeresPluginLibrary.WebpackModules.find(e => e.Messages && e.Messages.HOME);
    /* suck it you retarded asshole devilfuck */
    const SuffixEdited = React.memo(e => {
      const text = (e.__ML_hasMore === 'before' || e.__ML_hasMore === 'after') ? `There are ${e.__ML_numHidden} more edited messages ${e.__ML_hasMore} this one! Click to show!` : null;
      return React.createElement(
        Tooltip,
        {
          text: [(e.timestamp && e.__ML_shouldShow ? dateFormat(e.timestamp, 'LLLL') : null), text && React.createElement('br'), text],
          shouldShow: e.__ML_shouldShow || !!text
        },
        tt => React.createElement(
          'time',
          Object.assign({
            dateTime: e.timestamp ? e.timestamp.toISOString() : null,
            className: XenoLib.joinClassNames(this.multiClasses.edited, { [this.style.editedTagClicky]: !!text }),
            role: 'note'
          }, tt, {
            onClick: () => {
              try {
                tt.onClick();
              } catch (err) {
                ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Failed to execute tooltip onClick', err);
              }
              try {
                if (!text) return;
                e.__ML_showAllMessages();
              } catch (err) {
                ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Failed to show all edited messages', err);
              }
            }
          }), `(${/* i18n.Messages.MESSAGE_EDITED uhhhhhhhhh what now? */'edited'})${e.__ML_hasMore === 'before' ? ` <(${e.__ML_numHidden})` : e.__ML_hasMore === 'after' ? ` (${e.__ML_numHidden})>` : ''}`))
    });
    SuffixEdited.displayName = 'SuffixEdited';
    const parseContent = (() => {
      const parse = (() => {
        let ret = null;
        ZeresPluginLibrary.WebpackModules.getModule(e => {
          for (const val of Object.values(e)) {
            if (typeof val !== 'function') return false;
            const cont = val.toString();
            if (!cont.includes('customRenderedContent') || !cont.includes('hideSimpleEmbedContent')) return false;
            ret = val;
            return true;
          }
          return false;
        });
        return ret;
      })()
      if (parse) {
        return function parseContent() {
          const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE || React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
          const ReactDispatcher = internals ? Object.values(internals).find(e => e && e.useState) : null;
          if (!ReactDispatcher) return parse(...arguments);
          const oUseMemo = ReactDispatcher.useMemo;
          ReactDispatcher.useMemo = memo => memo();
          try {
            return parse(...arguments);
          } finally {
            ReactDispatcher.useMemo = oUseMemo;
          }
          return {};
        }
      }
      return null;
    })();
    const MessageContent = ZeresPluginLibrary.WebpackModules.getModule(e => !!e?.type?.toString()?.match(/,\w=\w\.state===\w\.(?:\w[^.]+)\.SEND_FAILED,\w=\w\.state===\w\.(?:\w[^.]+)\.SENDING/));
    const MemoMessage = await (async () => {
      const selector = `.${XenoLib.getSingleClass('message messageListItem')}`;
      var el = document.querySelector(selector) || (await new Promise(res => {
        var sub = ZeresPluginLibrary.DOMTools.observer.subscribeToQuerySelector(() => {
          ZeresPluginLibrary.DOMTools.observer.unsubscribe(sub);
          res(document.querySelector(selector));
        }, selector, null, true)
      }));
      return ZeresPluginLibrary.Utilities.findInTree(this.getReactInstance(el), e => ((typeof e?.memoizedProps?.renderContentOnly) === 'boolean'), { walkable: ['return'] })?.elementType
    })();

    if (!MessageContent || !MemoMessage) return XenoLib.Notifications.error('Failed to patch message components, edit history and deleted tint will not show!', { timeout: 0 });
    const useStateConstant = {};
    this.unpatches.push(
      this.Patcher.after(MessageContent, 'type', (_, [props], ret) => {
        const forceUpdate = React.useState(useStateConstant)[1];
        React.useEffect(
          () => {
            function callback(e) {
              if (!e || !e.id || e.id === props.message.id) {
                forceUpdate({});
              }
            }
            this.dispatcher.subscribe('ML_FORCE_UPDATE_MESSAGE_CONTENT', callback);
            return () => {
              this.dispatcher.unsubscribe('ML_FORCE_UPDATE_MESSAGE_CONTENT', callback);
            };
          },
          [props.message.id, forceUpdate]
        );
        if ((typeof props.className === 'string' && ~props.className.indexOf('repliedTextContent'))) return;
        if (!this.editedMessageRecord[props.message.channel_id] || this.editedMessageRecord[props.message.channel_id].indexOf(props.message.id) === -1) return;
        const record = this.messageRecord[props.message.id];
        if (!record || !Array.isArray(ret.props.children)) return;
        const createEditedMessage = (edit, editNum, options = { isSingular: false, noSuffix: false, hasMore: 'none', numHidden: 0 }) => {
          const { isSingular = false, noSuffix = false, hasMore = 'none', numHidden = 0 } = options;

          const result = React.createElement(() => // avoiding breaking the rules of react hooks :p
            [
              parseContent({ channel_id: props.message.channel_id, mentionChannels: props.message.mentionChannels, content: edit.content, embeds: [], isCommandType: () => false, hasFlag: () => false }, {}).content,
              noSuffix
                ? null
                : React.createElement(SuffixEdited, {
                  timestamp: new Date(edit.time),
                  __ML_hasMore: hasMore,
                  __ML_numHidden: numHidden,
                  __ML_shouldShow: !!isSingular,
                  __ML_showAllMessages: () => {
                    if (record.edits_hidden) record.edits_hidden = false;
                    if (this.settings.maxShownEdits && record.edit_history.length > this.settings.maxShownEdits) this.editModifiers[props.message.id] = { showAllEdits: true };
                    forceUpdate({});
                  }
                })
            ]
          );

          return React.createElement(
            XenoLib.ReactComponents.ErrorBoundary,
            { label: 'Edit history' },
            editNum === -1 ? result : React.createElement(
              Tooltip,
              {
                text: !!record.delete_data ? null : 'Edited: ' + this.createTimeStamp(edit.time),
                position: 'left',
                hideOnClick: true,
                shouldShow: !isSingular
              },
              _ =>
                React.createElement(
                  'div', // required div for the tooltip to properly position itself
                  {
                    ..._,
                    className: XenoLib.joinClassNames({ [this.style.editedCompact]: props.compact && !isSingular, [this.style.edited]: !isSingular }),
                    editNum
                  },
                  result
                )
            )
          );
        };
        ret.props.className = XenoLib.joinClassNames(ret.props.className, this.style.edited);
        const modifier = this.editModifiers[props.message.id];
        if (modifier?.editNum) {
          ret.props.children = [createEditedMessage(record.edit_history[modifier.editNum], -1, { isSingular: true, noSuffix: modifier.noSuffix })];
          return;
        }

        const oContent = Array.isArray(ret.props.children[0]) ? ret.props.children[0] : ret.props.children[1];

        if ((!this.settings.showEditedMessages && !modifier?.showAllEdits) || record.edits_hidden) {
          ret.props.children = [
            oContent,
            React.createElement(SuffixEdited, {
              timestamp: new Date(props.message.editedTimestamp),
              __ML_hasMore: 'before',
              __ML_numHidden: record.edit_history.length,
              __ML_shouldShow: true,
              __ML_showAllMessages: () => {
                if (record.edits_hidden) record.edits_hidden = false;
                if (this.settings.maxShownEdits && record.edit_history.length > this.settings.maxShownEdits) this.editModifiers[props.message.id] = { showAllEdits: true };
                forceUpdate({});
              }
            })
          ];
          return;
        }

        const edits = [];
        let i = 0;
        let max = record.edit_history.length;
        let hasMore = 'none';
        let hasMoreIdx = -1;
        if (this.settings.maxShownEdits && !modifier?.showAllEdits) {
          if (record.edit_history.length > this.settings.maxShownEdits) {
            if (this.settings.hideNewerEditsFirst) {
              max = this.settings.maxShownEdits;
              hasMore = 'after';
              hasMoreIdx = max - 1;
            } else {
              i = record.edit_history.length - this.settings.maxShownEdits;
              hasMore = 'before';
              hasMoreIdx = i;
            }
          }
        }
        const numHidden = record.edit_history.length - this.settings.maxShownEdits;
        for (; i < max; i++) {
          const edit = record.edit_history[i];
          if (!edit) continue;
          let editNum = i;
          edits.push(createEditedMessage(edit, editNum, i === hasMoreIdx ? { hasMore, numHidden } : {}));
        }
        ret.props.children = [edits, oContent];
      })
    );

    const messageClass = XenoLib.getSingleClass('ephemeral message');
    const _self = this;
    function Message(props, ...whatever) {
      try {
        const ret = props.__ML_type(props, ...whatever);
        if (!props.__ML_deleteTime) return ret;
        const oRef = ret.props.children.ref;
        ret.props.children.ref = e => {
          if (e && !e.__tooltip) {
            // later
            new ZeresPluginLibrary.Tooltip(e, 'Deleted: ' + _self.tools.createMomentObject(props.__ML_deleteTime).format('LLLL'), { side: 'left' });
            e.__tooltip = true;
          }
          if (typeof oRef === 'function') return oRef(e);
          else if (XenoLib._.isObject(oRef)) oRef.current = e;
        };
        return ret;
      } catch (err) {
        ZeresPluginLibrary.Logger.stacktrace(_self.getName(), 'Error in Message replacement component', err);
      }
      return null;
    }
    this.unpatches.push(
      this.Patcher.after(MemoMessage, 'type', (_, [props], ret) => {
        const forceUpdate = React.useState(useStateConstant)[1];
        React.useEffect(
          () => {
            function callback(e) {
              if (!e || !e.id || e.id === props.message.id) forceUpdate({});
            }
            this.dispatcher.subscribe('ML_FORCE_UPDATE_MESSAGE', callback);
            return () => {
              this.dispatcher.unsubscribe('ML_FORCE_UPDATE_MESSAGE', callback);
            };
          },
          [props.message.id, forceUpdate]
        );
        const record = this.messageRecord[props.message.id];
        if (!record) return;
        if (props.message.editedTimestamp) record.message.edited_timestamp = new Date(props.message.editedTimestamp).getTime();
        if (!record.delete_data) return;
        if (this.noTintIds.indexOf(props.message.id) !== -1) return;
        const message = ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && typeof e?.props?.className === 'string' && ~e?.props?.className?.split(' ').indexOf(messageClass));
        if (!message) return;
        message.props.className += ' ' + (this.settings.useAlternativeDeletedStyle ? this.style.deletedAlt : this.style.deleted);
        message.props['data-ml-deleted'] = 'true';
        message.props.__ML_deleteTime = record.delete_data.time;
        message.props.__ML_type = message.type;
        message.type = Message;
      })
    );
    this.forceReloadMessages();
  }
  forceReloadMessages() {
    const chatEl = document.querySelector('[class*="chatContent"]') || document.querySelector('[class*="chat_"]');
    if (!chatEl) return;
    const instance = ZeresPluginLibrary.Utilities.findInTree(this.getReactInstance(chatEl), e => ((typeof e?.memoizedProps?.showQuarantinedUserBanner) === 'boolean'), { walkable: ['return'] })?.stateNode;
    if (!instance) return;
    const unpatch = this.Patcher.after(instance, 'render', (_this, _, ret) => {
      unpatch();
      if (!ret) return;
      ret.key = Math.random().toString(36).substring(2, 10).toUpperCase();
      ret.ref = () => _this.forceUpdate();
    });
    instance.forceUpdate();
  }
  closeContextMenu() {
    this.dispatcher.dispatch({ type: 'CONTEXT_MENU_CLOSE' });
  }
  patchModal() {
    try {
      const confirmationModalRegex = /header:\w,children:\w,confirmText:\w,cancelText:\w,className:\w,onConfirm:\w,onCancel:\w,onClose:\w,onCloseCallback:\w/;
      const confirmModalModule = BdApi.Webpack.getBySource(confirmationModalRegex);
      const confirmModal = confirmModalModule ? Object.values(confirmModalModule).find(e => typeof e === 'function' && e.toString().match(confirmationModalRegex)) : null;
      if (confirmModal) {
        this.createModal.confirmationModal = props => {
          try {
            const ret = confirmModal(props);
            if (!ret) return null;
            if (props.size) ret.props.size = props.size;

            if (props.onCancel) {
              const cancelButton = ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.type === XenoLib.ReactComponents.Button && e.props && e.props.look);
              if (cancelButton) cancelButton.props.onClick = props.onCancel;
            }
            return ret;
          } catch (err) {
            if (props.onCancel) props.onCancel();
            else props.onClose();
            return null;
          }
        };
      } else {
        ZeresPluginLibrary.Logger.warn(this.getName(), 'Could not find confirmation modal component, using fallback');
        this.createModal.confirmationModal = props => {
          return React.createElement('div', { className: props.className, style: { padding: '16px' } },
            props.header ? (typeof props.header === 'string'
              ? React.createElement('h2', { style: { color: 'var(--header-primary)', marginBottom: '16px' } }, props.header)
              : props.header) : null,
            ...(Array.isArray(props.children) ? props.children : [props.children]),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' } },
              props.cancelText ? React.createElement('button', {
                className: 'bd-button',
                onClick: props.onCancel || props.onClose,
                style: { padding: '8px 16px', borderRadius: '3px', backgroundColor: 'var(--background-secondary)', color: 'var(--text-normal)', border: 'none', cursor: 'pointer' }
              }, props.cancelText) : null,
              props.confirmText ? React.createElement('button', {
                className: 'bd-button',
                onClick: props.onConfirm || props.onClose,
                style: { padding: '8px 16px', borderRadius: '3px', backgroundColor: 'var(--brand-experiment)', color: 'white', border: 'none', cursor: 'pointer' }
              }, props.confirmText) : null
            )
          );
        };
      }
    } catch (err) {
      ZeresPluginLibrary.Logger.warn(this.getName(), 'patchModal failed', err);
      this.createModal.confirmationModal = props => {
        return React.createElement('div', { className: props.className, style: { padding: '16px' } },
          props.header ? (typeof props.header === 'string'
            ? React.createElement('h2', { style: { color: 'var(--header-primary)', marginBottom: '16px' } }, props.header)
            : props.header) : null,
          ...(Array.isArray(props.children) ? props.children : [props.children]),
          React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' } },
            props.cancelText ? React.createElement('button', {
              onClick: props.onCancel || props.onClose,
              style: { padding: '8px 16px', borderRadius: '3px', backgroundColor: 'var(--background-secondary)', color: 'var(--text-normal)', border: 'none', cursor: 'pointer' }
            }, props.cancelText) : null,
            props.confirmText ? React.createElement('button', {
              onClick: props.onConfirm || props.onClose,
              style: { padding: '8px 16px', borderRadius: '3px', backgroundColor: 'var(--brand-experiment)', color: 'white', border: 'none', cursor: 'pointer' }
            }, props.confirmText) : null
          )
        );
      };
    }
    // Modal lifecycle is handled by our custom overlay, no need for XenoLib modal store tracking
    /*
    this.createModal.confirmationModal = class ConfirmationModal extends ZeresPluginLibrary.DiscordModules.ConfirmationModal {
      constructor(props) {
        super(props);
        this._handleSubmit = this.handleSubmit.bind(this);
        this._handleClose = this.handleClose.bind(this);
        this.handleSubmit = this.handleSubmitEx.bind(this);
        this.handleClose = this.handleCloseEx.bind(this);
      }
      handleSubmitEx(e) {
        if (this.props.ml2Data) onClearLog(e);
        else return this._handleSubmit(e);
      }
      handleCloseEx(e) {
        if (this.props.ml2Data) onChangeOrder(e);
        else return this._handleClose(e);
      }
      render() {
        const ret = super.render();
        if (!ret) return ret;
        delete ret.props['aria-label'];
        return ret;
      }
    };
    this.unpatches.push(
      ZeresPluginLibrary.Patcher.instead(this.getName(), ZeresPluginLibrary.DiscordModules.ConfirmationModal.prototype, 'componentDidMount', (thisObj, args, original) => {
        if (thisObj.props.ml2Data) {
          if (this.menu.refilterOnMount) {
            this.refilterMessages();
            this.menu.refilterOnMount = false;
          }
          document.getElementById(this.style.menuMessages).parentElement.parentElement.parentElement.scrollTop = this.scrollPosition;
        }
        return original(...args);
      })
    );
*/
  }
  buildMenu(setup) {
    const ret = ZeresPluginLibrary.DCM.buildMenu(setup);
    return props => ret({ ...props, onClose: _ => { } });
  }
  // >>-|| POPULATION ||-<<
  createMessageGroup(message, isStart) {
    let deleted = false;
    let edited = false;
    let details = 'Sent in';
    let channel = this.tools.getChannel(message.channel_id);
    let timestamp = message.timestamp;
    let author = this.tools.getUser(message.author.id);
    let noUserInfo = false;
    let userInfoBeingRequested = true;
    const isBot = message.author.bot;
    const record = this.messageRecord[message.id];
    if (record) {
      deleted = !!record.delete_data;
      edited = !!record.edit_history;

      if (deleted && edited) {
        details = 'Edited and deleted from';
        timestamp = record.delete_data.time;
      } else if (deleted) {
        details = 'Deleted from';
        timestamp = record.delete_data.time;
      } else if (edited) {
        details = 'Last edit in'; // todo: purged?
        if (typeof record.edit_history[record.edit_history.length - 1].time !== 'string') timestamp = record.edit_history[record.edit_history.length - 1].time;
      }
    }

    details += ` ${this.getLiteralName(message.guild_id || (channel && channel.guild_id), message.channel_id)} `;

    details += `at ${this.createTimeStamp(timestamp, true)}`;

    details = details.replace(/[<>"&]/g, c => ({ "<": "&lt;", ">": "&gt;", "\"": "&quot;", "&": "&amp;" })[c]);
    const classes = this.createMessageGroup.classes;
    const getAvatarOf = user => {
      if (!user.avatar) return '/assets/322c936a8c8be1b803cd94861bdfa868.png';
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
    };
    if (!classes.extra)
      classes.extra = [
        /* 0 */ XenoLib.joinClassNames(XenoLib.getClass('groupStart message'), XenoLib.getClass('groupStart cozyMessage'), XenoLib.getClass('systemMessage groupStart'), XenoLib.getClass('zalgo wrapper'), XenoLib.getClass('zalgo cozy'), XenoLib.getClass('cozy zalgo')),
        /* 1 */ XenoLib.joinClassNames(XenoLib.getClass('groupStart message'), XenoLib.getClass('groupStart cozyMessage'), XenoLib.getClass('zalgo wrapper'), XenoLib.getClass('zalgo cozy'), XenoLib.getClass('cozy zalgo')),
        /* 2 */ XenoLib.getClass('isSending header'),
        /* 3 */ XenoLib.joinClassNames(XenoLib.getClass('edited avatar'), XenoLib.getClass('edited avatar clickable')),
        /* 4 */ XenoLib.joinClassNames(XenoLib.getClass('timestampTooltip username'), XenoLib.getClass('edited avatar clickable')),
        /* 5 */ XenoLib.joinClassNames(XenoLib.getClass('separator timestamp'), XenoLib.getClass('separator timestampInline')),
        /* 6 */ XenoLib.joinClassNames(this.multiClasses.markup, XenoLib.getClass('buttonContainer markupRtl')),
        /* 7 */ XenoLib.getClass('avatarDecoration messageContent'),
        /* 8 */ XenoLib.joinClassNames(XenoLib.getClass('zalgo latin24CompactTimeStamp'), XenoLib.getClass('separator timestamp'), XenoLib.getClass('alt timestampVisibleOnHover'), XenoLib.getClass('timestampVisibleOnHover alt')),
        /* 9 */ XenoLib.getClass('latin24CompactTimeStamp separator'),
        /* 10 */ XenoLib.getSingleClass('timestampTooltip username'),
        /* 11 */ XenoLib.getSingleClass('separator timestamp'),
        /* 12 */ XenoLib.getClass('zalgo contents')
      ];

    const element = isStart
      ? this.parseHTML(`<div class="${classes.extra[0]}">
                                      <div class="${classes.extra[12]}">
                                        <img src="${getAvatarOf(message.author)}" class="${classes.extra[3]}" alt=" "><h2 class="${classes.extra[2]}"><span class="${classes.extra[4]}" role="button">${message.author.username.replace(/[<>"]/g, c => ({ "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c])}</span>${(isBot && `<span class="${classes.botTag}">BOT</span>`) || ''}<span class="${classes.extra[5]}"><span >${details}</span></span></h2>
                                        <div class="${classes.extra[6]}"></div>
                                      </div>
                                      <div class="${classes.extra[7]}"></div>
                                    </div>`)
      : this.parseHTML(`<div class="${classes.extra[1]}">
                                    <div class="${classes.extra[12]}">
                                      <span class="${classes.extra[8]}">
                                        <span>
                                          <i class="${classes.extra[9]}">[</i>
                                          ${this.createTimeStamp(timestamp, -1)}
                                          <i class="${classes.extra[9]}">] </i>
                                        </span>
                                      </span>
                                      <div class="${classes.extra[6]}"></div>
                                    </div>
                                    <div class="${classes.extra[7]}"></div>
                                  </div>`);
    element.messageId = message.id;
    const profImg = element.getElementsByClassName(classes.avatarImgSingle)[0];
    if (profImg) {
      profImg.onerror = () => {
        profImg.src = '/assets/322c936a8c8be1b803cd94861bdfa868.png';
      };
      const verifyProfilePicture = () => {
        if (message.author.avatar != author.avatar && author.avatar) {
          profImg.src = getAvatarOf(author);
          if (record) {
            record.message.author.avatar = author.avatar;
          }
        } else {
          if (record) record.message.author.avatar = null;
        }
      };
      if (!isBot || true) {
        if (!author) {
          author = message.author;
          if (this.menu.userRequestQueue.findIndex(m => m.id === author.id) == -1) {
            this.menu.userRequestQueue.push({
              id: author.id,
              username: author.username,
              success: [
                res => {
                  author = $.extend(true, {}, res);
                  verifyProfilePicture();
                  userInfoBeingRequested = false;
                }
              ],
              fail: [
                () => {
                  noUserInfo = true;
                  userInfoBeingRequested = false;
                }
              ]
            });
          } else {
            const dt = this.menu.userRequestQueue.find(m => m.id === author.id);
            dt.success.push(res => {
              author = $.extend(true, {}, res);
              verifyProfilePicture();
              userInfoBeingRequested = false;
            });
            dt.fail.push(() => {
              noUserInfo = true;
              userInfoBeingRequested = false;
            });
          }
        } else {
          userInfoBeingRequested = false;
          verifyProfilePicture();
        }
      }
      const profIcon = element.getElementsByClassName(classes.avatarImgSingle)[0];
      profIcon.addEventListener('click', () => {
        //if (isBot) return this.showToast('User is a bot, this action is not possible on a bot.', { type: 'error', timeout: 5000 });
        if (userInfoBeingRequested) return this.showToast('Internal error', { type: 'info', timeout: 5000 });
        if (noUserInfo) return this.showToast('Could not get user info!', { type: 'error' });
        ZeresPluginLibrary.Popouts.showUserPopout(profIcon, author);
      });
      profIcon.addEventListener('contextmenu', e => {
        //if (isBot) return this.showToast('User is a bot, this action is not possible on a bot.', { type: 'error', timeout: 5000 });
        if (userInfoBeingRequested) return this.showToast('Internal error', { type: 'info', timeout: 5000 });
        if (noUserInfo) return this.showToast('Could not get user info! You can only delete or copy to clipboard!', { timeout: 5000 });
        ZeresPluginLibrary.WebpackModules.getByProps('openUserContextMenu').openUserContextMenu(e, author, channel || this.menu.randomValidChannel);
      });
      const nameLink = element.getElementsByClassName(classes.extra[10])[0];
      nameLink.addEventListener('click', () => {
        //if (isBot) return this.showToast('User is a bot, this action is not possible on a bot.', { type: 'error', timeout: 5000 });
        if (userInfoBeingRequested) return this.showToast('Internal error', { type: 'info', timeout: 5000 });
        if (noUserInfo) return this.showToast('Could not get user info!', { type: 'error' });
        ZeresPluginLibrary.Popouts.showUserPopout(nameLink, author);
      });
      nameLink.addEventListener('contextmenu', e => {
        //if (isBot) return this.showToast('User is a bot, this action is not possible on a bot.', { type: 'error', timeout: 5000 });
        if (userInfoBeingRequested) return this.showToast('Internal error', { type: 'info', timeout: 5000 });
        if (noUserInfo) return this.showToast('Could not get user info! You can only delete or copy to clipboard!', { type: 'error', timeout: 5000 });
        ZeresPluginLibrary.WebpackModules.getByProps('openUserContextMenu').openUserContextMenu(e, author, channel || this.menu.randomValidChannel);
      });
      const timestampEl = element.getElementsByClassName(classes.extra[11])[0];
      timestampEl.addEventListener('contextmenu', e => {
        const messages = [element];
        let target = element.nextElementSibling;
        while (target && target.classList && !target.classList.contains(XenoLib.getSingleClass('systemMessage groupStart'))) {
          messages.push(target);
          target = target.nextElementSibling;
        }
        if (!messages.length) return;
        const messageIds = [];
        for (let i = 0; i < messages.length; i++) if (messages[i] && messages[i].messageId) messageIds.push(messages[i].messageId);
        if (!messageIds.length) return;
        ZeresPluginLibrary.DCM.openContextMenu(
          e,
          this.buildMenu([
            {
              type: 'group',
              items: [
                {
                  label: 'Copy Formatted Message',
                  action: () => {
                    this.closeContextMenu();
                    let result = '';
                    for (let msgid of messageIds) {
                      const record = this.messageRecord[msgid];
                      if (!record) continue;
                      if (!result.length) result += `> **${record.message.author.username}** | ${this.createTimeStamp(record.message.timestamp, true)}\n`;
                      result += `> ${record.message.content.replace(/\n/g, '\n> ')}\n`;
                    }
                    navigator.clipboard.writeText(result)
                      .then(_ => this.showToast('Copied!', { type: 'success' }))
                      .catch(_ => this.showToast('Failed to copy!', { type: 'error' }));
                  }
                },
                {
                  type: 'item',
                  label: 'Remove Group From Log',
                  action: () => {
                    this.closeContextMenu();
                    let invalidatedChannelCache = false;
                    for (let msgid of messageIds) {
                      const record = this.messageRecord[msgid];
                      if (!record) continue; // the hell
                      if ((record.edit_history && !record.edits_hidden) || (record.delete_data && !record.delete_data.hidden)) this.invalidateChannelCache((invalidatedChannelCache = record.message.channel_id));
                      this.deleteMessageFromRecords(msgid);
                    }
                    if (invalidatedChannelCache) this.cacheChannelMessages(invalidatedChannelCache);
                    this.refilterMessages(); // I don't like calling that, maybe figure out a way to animate it collapsing on itself smoothly
                    this.saveData();
                  }
                }
              ]
            }
          ])
        );
      });
      timestampEl.addEventListener('click', e => {
        if (!this.menu.deleteKeyDown) return;
        const messages = [element];
        let target = element.nextElementSibling;
        while (target && target.classList && !target.classList.contains(XenoLib.getSingleClass('systemMessage groupStart'))) {
          messages.push(target);
          target = target.nextElementSibling;
        }
        if (!messages.length) return;
        const messageIds = [];
        for (let i = 0; i < messages.length; i++) if (messages[i] && messages[i].messageId) messageIds.push(messages[i].messageId);
        if (!messageIds.length) return;
        let invalidatedChannelCache = false;
        for (let msgid of messageIds) {
          const record = this.messageRecord[msgid];
          if (!record) continue; // the hell
          if ((record.edit_history && !record.edits_hidden) || (record.delete_data && !record.delete_data.hidden)) this.invalidateChannelCache((invalidatedChannelCache = record.message.channel_id));
          this.deleteMessageFromRecords(msgid);
        }
        if (invalidatedChannelCache) this.cacheChannelMessages(invalidatedChannelCache);
        this.refilterMessages(); // I don't like calling that, maybe figure out a way to animate it collapsing on itself smoothly
        this.saveData();
      });
      new ZeresPluginLibrary.Tooltip(timestampEl, 'Sent at ' + this.tools.createMomentObject(message.timestamp).format('LLLL'), { side: 'top' });
    }
    const messageContext = e => {
      let target = e.target;
      if (!target.classList.contains('mention') || (target.tagName == 'DIV' && target.classList.contains(ZeresPluginLibrary.WebpackModules.getByProps('imageError').imageError.split(/ /g)[0]))) {
        let isMarkup = false;
        let isEdited = false;
        let isBadImage = target.tagName == 'DIV' && target.classList == ZeresPluginLibrary.WebpackModules.getByProps('imageError').imageError;
        if (!isBadImage) {
          while (target && (!target.classList || !(isMarkup = target.classList.contains(this.classes.markup)))) {
            if (target.classList && target.classList.contains(this.style.edited)) isEdited = target;
            target = target.parentElement;
          }
        }

        if (isMarkup || isBadImage) {
          const messageId = message.id;
          const record = this.getSavedMessage(messageId);
          if (!record) return;
          let editNum = -1;
          if (isEdited) editNum = isEdited.edit;
          const menuItems = [];
          if (channel) {
            menuItems.push({
              type: 'item',
              label: 'Jump to Message',
              action: () => {
                this.closeContextMenu();
                this.jumpToMessage(message.channel_id, messageId, message.guild_id);
              }
            });
          }
          if (!isBadImage || record.message.content.length) {
            menuItems.push(
              {
                type: 'item',
                label: 'Copy Text',
                action: () => {
                  this.closeContextMenu();
                  navigator.clipboard.writeText(editNum != -1 ? record.edit_history[editNum].content : record.message.content)
                    .then(_ => this.showToast('Copied!', { type: 'success' }))
                    .catch(_ => this.showToast('Failed to copy!', { type: 'error' }));
                }
              },
              {
                type: 'item',
                label: 'Copy Formatted Message',
                action: () => {
                  this.closeContextMenu();
                  const content = editNum != -1 ? record.edit_history[editNum].content : record.message.content;
                  const result = `> **${record.message.author.username}** | ${this.createTimeStamp(record.message.timestamp, true)}\n> ${content.replace(/\n/g, '\n> ')}`;
                  navigator.clipboard.writeText(result)
                    .then(_ => this.showToast('Copied!', { type: 'success' }))
                    .catch(_ => this.showToast('Failed to copy!', { type: 'error' }));
                }
              }
            );
          }
          if (record.delete_data && record.delete_data.hidden) {
            menuItems.push({
              type: 'item',
              label: 'Unhide Deleted Message',
              action: () => {
                this.closeContextMenu();
                record.delete_data.hidden = false;
                this.invalidateChannelCache(record.message.channel_id); // good idea?
                this.cacheChannelMessages(record.message.channel_id);
                this.saveData();
                this.showToast('Unhidden!', { type: 'success' });
              }
            });
          }
          if (record.edit_history) {
            if (editNum != -1) {
              menuItems.push({
                type: 'item',
                label: 'Delete Edit',
                action: () => {
                  this.closeContextMenu();
                  this.deleteEditedMessageFromRecord(messageId, editNum);
                  this.refilterMessages(); // I don't like calling that, maybe figure out a way to animate it collapsing on itself smoothly
                  this.showToast('Deleted!', { type: 'success' });
                }
              });
            }
            if (record.edits_hidden) {
              menuItems.push({
                type: 'item',
                label: 'Unhide Edits',
                action: () => {
                  this.closeContextMenu();
                  record.edits_hidden = false;
                  this.saveData();
                  this.showToast('Unhidden!', { type: 'success' });
                }
              });
            }
          }
          menuItems.push(
            {
              type: 'item',
              label: 'Remove From Log',
              action: () => {
                this.closeContextMenu();
                let invalidatedChannelCache = false;
                if ((record.edit_history && !record.edits_hidden) || (record.delete_data && !record.delete_data.hidden)) this.invalidateChannelCache((invalidatedChannelCache = record.message.channel_id));
                this.deleteMessageFromRecords(messageId);
                this.refilterMessages(); // I don't like calling that, maybe figure out a way to animate it collapsing on itself smoothly
                if (invalidatedChannelCache) this.cacheChannelMessages(invalidatedChannelCache);
                this.saveData();
                if (record.message.channel_id !== this.selectedChannel.id) return;
                if (record.delete_data) {
                  this.dispatcher.dispatch({
                    type: 'MESSAGE_DELETE',
                    id: messageId,
                    channelId: record.message.channel_id,
                    ML: true // ignore ourselves lol, it's already deleted
                    // on a side note, probably does nothing if we don't ignore
                  });
                } else {
                  this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                }
              }
            },
            {
              type: 'item',
              label: 'Copy Message ID',
              action: () => {
                this.closeContextMenu();
                navigator.clipboard.writeText(messageId)
                  .then(_ => this.showToast('Copied!', { type: 'success' }))
                  .catch(_ => this.showToast('Failed to copy!', { type: 'error' }));
              }
            },
            {
              type: 'item',
              label: 'Copy Author ID',
              action: () => {
                this.closeContextMenu();
                navigator.clipboard.writeText(message.author.id)
                  .then(_ => this.showToast('Copied!', { type: 'success' }))
                  .catch(_ => this.showToast('Failed to copy!', { type: 'error' }));
              }
            }
          );
          ZeresPluginLibrary.DCM.openContextMenu(
            e,
            this.buildMenu([
              {
                type: 'group',
                items: menuItems
              }
            ])
          );
          return;
        }
      }
    };
    element.addEventListener('contextmenu', e => messageContext(e));
    element.addEventListener('click', e => {
      if (!this.menu.deleteKeyDown) return;
      let target = e.target;
      let isMarkup = false;
      let isEdited = false;
      let isBadImage = target.tagName == 'DIV' && target.classList == ZeresPluginLibrary.WebpackModules.getByProps('imageError').imageError;
      if (!isBadImage) {
        while (!target.classList.contains('message-2qnXI6') && !(isMarkup = target.classList.contains(this.classes.markup))) {
          if (target.classList.contains(this.style.edited)) isEdited = target;
          target = target.parentElement;
        }
      }
      if (!isMarkup && !isBadImage) return;
      const messageId = message.id;
      const record = this.messageRecord[messageId];
      if (!record) return;
      this.invalidateChannelCache(record.message.channel_id); // good idea?
      this.cacheChannelMessages(record.message.channel_id);
      if (isEdited) {
        this.deleteEditedMessageFromRecord(messageId, isEdited.edit);
      } else {
        this.deleteMessageFromRecords(messageId);
      }
      this.refilterMessages(); // I don't like calling that, maybe figure out a way to animate it collapsing on itself smoothly
      this.saveData();
    });
    return element;
  }
  populateParent(parent, messages) {
    let lastMessage;
    let lastType; /* unused */
    let messageGroup;
    const populate = i => {
      try {
        // todo: maybe make the text red if it's deleted?
        const messageId = messages[i];
        const record = this.getSavedMessage(messageId);
        const message = record ? record.message : this.getMessageAny(messageId);
        if (!message) return;
        // todo: get type and use it
        if (!messageGroup /*  || !lastType */ || !lastMessage || lastMessage.channel_id != message.channel_id || lastMessage.author.id != message.author.id || new Date(message.timestamp).getDate() !== new Date(lastMessage.timestamp).getDate() || (message.attachments.length && message.content.length)) {
          messageGroup = this.createMessageGroup(message, true);
        } else {
          messageGroup = this.createMessageGroup(message);
        }
        lastMessage = message;
        const markup = messageGroup.getElementsByClassName(this.classes.markup)[0];
        const contentDiv = messageGroup.getElementsByClassName(XenoLib.getSingleClass('avatarDecoration messageContent'))[0];
        if (record && record.edit_history) {
          markup.classList.add(this.style.edited);
          for (let ii = 0; ii < record.edit_history.length; ii++) {
            const hist = record.edit_history[ii];
            const editedMarkup = this.formatMarkup(hist.content, message.channel_id);
            editedMarkup.insertAdjacentHTML('beforeend', `<time class="${this.multiClasses.edited}">(edited)</time>`); // TODO, change this
            new ZeresPluginLibrary.Tooltip(editedMarkup, 'Edited at ' + (typeof hist.time === 'string' ? hist.time : this.createTimeStamp(hist.time)), { side: 'left' });
            editedMarkup.classList.add(this.style.edited);
            editedMarkup.edit = ii;
            markup.appendChild(editedMarkup);
          }
        }
        markup.append(this.formatMarkup(message.content, message.channel_id));
        if (!record) {
          const channel = this.tools.getChannel(message.channel_id);
          const guild = this.tools.getServer(channel && channel.guild_id);
          markup.addEventListener('click', () => this.jumpToMessage(message.channel_id, message.id, guild && guild.id));
        }
        // todo, embeds
        // how do I do embeds?

        // why don't attachments show for sent messages? what's up with that?
        if (message.attachments.length) {
          // const attachmentsContent = this.parseHTML(`<div class="${this.multiClasses.message.cozy.content}"></div>`);
          const attemptToUseCachedImage = (attachmentId, attachmentIdx, hidden, filename, width, height) => {
            const img = document.createElement('img');
            img.classList = ZeresPluginLibrary.WebpackModules.getByProps('clickable').clickable;
            img.messageId = messageId;
            img.idx = attachmentIdx;
            img.id = attachmentId; // USED FOR FINDING THE IMAGE THRU CONTEXT MENUS
            if (hidden) {
              img.src = `https://i.clouds.tf/q2vy/r8q6.png#${record.message.channel_id},${img.id}`;
              img.width = 200;
            } else {
              img.src = 'http://localhost:7474/' + attachmentId + filename.match(/\.[0-9a-z]+$/i)[0] + `#${record.message.channel_id},${img.id}`;
              img.width = 256;
            }
            img.addEventListener('click', e => {
              if (this.menu.deleteKeyDown) {
                this.deleteMessageFromRecords(messageId);
                this.refilterMessages(); // I don't like calling that, maybe figure out a way to animate it collapsing on itself smoothly
                this.saveData();
                return;
              }
              this.createModal(
                {
                  src: img.src + '?ML=true', // self identify
                  placeholder: img.src, // cute image here
                  original: img.src,
                  width: width,
                  height: height,
                  onClickUntrusted: e => e.openHref(),
                  className: this.style.imageRoot
                },
                true
              );
            });
            img.onerror = () => {
              const imageErrorDiv = document.createElement('div');
              imageErrorDiv.classList = ZeresPluginLibrary.WebpackModules.getByProps('imageError').imageError;
              imageErrorDiv.messageId = messageId;
              contentDiv.replaceChild(imageErrorDiv, img);
            };
            contentDiv.appendChild(img);
            return true;
          };
          const handleCreateImage = (attachment, idx) => {
            if (attachment.url == 'ERROR') {
              attemptToUseCachedImage(attachment.id, idx, attachment.hidden, attachment.filename, attachment.width, attachment.height);
            } else {
              if (!this.isImage(attachment.url)) return; // bruh
              const img = document.createElement('img');
              img.classList = ZeresPluginLibrary.WebpackModules.getByProps('clickable').clickable;
              img.messageId = messageId;
              img.id = attachment.id; // USED FOR FINDING THE IMAGE THRU CONTEXT MENUS
              img.idx = idx;
              // img.style.minHeight = '104px'; // bruh?
              if (record) {
                img.addEventListener('click', () => {
                  if (this.menu.deleteKeyDown) {
                    this.deleteMessageFromRecords(messageId);
                    this.refilterMessages(); // I don't like calling that, maybe figure out a way to animate it collapsing on itself smoothly
                    this.saveData();
                    return;
                  }
                  this.createModal(
                    {
                      src: attachment.url + '?ML=true', // self identify
                      placeholder: attachment.url, // cute image here
                      original: attachment.url,
                      width: attachment.width,
                      height: attachment.height,
                      onClickUntrusted: e => e.openHref(),
                      className: this.style.imageRoot
                    },
                    true
                  );
                });
              }
              img.onerror = () => {
                if (img.triedCache) {
                  const imageErrorDiv = document.createElement('div');
                  imageErrorDiv.classList = ZeresPluginLibrary.WebpackModules.getByProps('imageError').imageError;
                  imageErrorDiv.messageId = messageId;
                  contentDiv.replaceChild(imageErrorDiv, img);
                }
                if (record) {
                  fetch(attachment.url, { method: 'HEAD' }).then(res => {
                    try {
                      if (res.status != 404) return;
                      record.message.attachments[idx].url = 'ERROR';
                      img.src = 'http://localhost:7474/' + attachment.id + attachment.filename.match(/\.[0-9a-z]+$/)[0];
                      img.triedCache = true;
                    } catch (err) {
                      console.error('Failed loading cached image', err.message);
                    }
                  }).catch(err => {
                    console.error('Failed loading cached image', err.message);
                  });
                }
              };
              if (attachment.hidden) {
                img.src = `https://i.clouds.tf/q2vy/r8q6.png#${record.message.channel_id},${img.id}`;
                img.width = 200;
              } else {
                img.src = attachment.url;
                img.width = this.clamp(attachment.width, 200, 650);
              }
              contentDiv.appendChild(img);
            }
          };
          for (let ii = 0; ii < message.attachments.length; ii++) handleCreateImage(message.attachments[ii], ii);
        }
        if (message.embeds && message.embeds.length && false) {
          const ddiv = document.createElement('div');
          // TODO: optimize
          if (!this.populateParent.__embedcontainer) this.populateParent.__embedcontainer = this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozy', 'gifFavoriteButton').containerCozy, 'containerCozy');
          ddiv.className = this.populateParent.__embedcontainer;
          const fuckme = new (ZeresPluginLibrary.WebpackModules.getByDisplayName('MessageAccessories'))({ channel: this.tools.getChannel(message.channel_id) || this.menu.randomValidChannel });
          for (const embed of message.embeds) {
            const embedBase = {
              GIFVComponent: ZeresPluginLibrary.WebpackModules.getByDisplayName('LazyGIFV'),
              ImageComponent: ZeresPluginLibrary.WebpackModules.getByDisplayName('LazyImageZoomable'),
              LinkComponent: ZeresPluginLibrary.WebpackModules.getByDisplayName('MaskedLink'),
              VideoComponent: ZeresPluginLibrary.WebpackModules.getByDisplayName('LazyVideo'),
              allowFullScreen: true,
              autoPlayGif: true,
              backgroundOpacity: '',
              className: ZeresPluginLibrary.WebpackModules.getByProps('embedWrapper', 'gifFavoriteButton').embedWrapper,
              embed: ZeresPluginLibrary.WebpackModules.getByProps('sanitizeEmbed').sanitizeEmbed(message.channel_id, message.id, embed),
              hideMedia: false,
              inlineGIFV: true,
              maxMediaHeight: 300,
              maxMediaWidth: 400,
              maxThumbnailHeight: 80,
              maxThumbnailWidth: 80,
              suppressEmbed: false,
              renderTitle: fuckme.renderEmbedTitle.bind(fuckme),
              renderDescription: fuckme.renderEmbedDescription.bind(fuckme),
              renderLinkComponent: ZeresPluginLibrary.WebpackModules.getByProps('defaultRenderLinkComponent').defaultRenderLinkComponent,
              renderImageComponent: ZeresPluginLibrary.WebpackModules.getByProps('renderImageComponent').renderImageComponent,
              renderVideoComponent: ZeresPluginLibrary.WebpackModules.getByProps('renderVideoComponent').renderVideoComponent,
              renderAudioComponent: ZeresPluginLibrary.WebpackModules.getByProps('renderAudioComponent').renderAudioComponent,
              renderMaskedLinkComponent: ZeresPluginLibrary.WebpackModules.getByProps('renderMaskedLinkComponent').renderMaskedLinkComponent
            };
            ZeresPluginLibrary.DiscordModules.ReactDOM.render(React.createElement(ZeresPluginLibrary.WebpackModules.getByDisplayName('Embed'), embedBase), ddiv);
          }
          contentDiv.appendChild(ddiv);
        }
        if (!contentDiv.childElementCount && !message.content.length) return; // don't bother
        //messageContent.appendChild(divParent);
        parent.appendChild(messageGroup);
      } catch (err) {
        ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Error in populateParent', err);
      }
    };
    let i = 0;
    const addMore = () => {
      for (let added = 0; i < messages.length && (added < this.settings.renderCap || (this.menu.shownMessages != -1 && i < this.menu.shownMessages)); i++, added++) populate(i);
      handleMoreMessages();
      this.menu.shownMessages = i;
    };
    const handleMoreMessages = () => {
      if (i < messages.length) {
        const div = document.createElement('div');
        const moreButton = this.createButton('𝗅𝐨𝐚𝖽 𝗆𝐨𝗋𝐞', function () {
          this.parentElement.remove();
          addMore();
        });
        moreButton.style.width = '100%';
        moreButton.style.marginBottom = '20px';
        div.appendChild(moreButton);
        parent.appendChild(div);
      }
    };

    if (this.settings.renderCap) addMore();
    else for (; i < messages.length; i++) populate(i);
    this.processUserRequestQueue();
    if (!messages.length) {
      const strong = document.createElement('strong');
      strong.className = this.multiClasses.defaultColor;
      strong.innerText = "\u2728 𝗇𝐨𝗍𝗁𝐢𝗇𝗀 𝗁𝐞𝗋𝐞 𝗒𝐞𝗍 \u2728\n𝗇𝐨 𝗆𝐞𝗌𝗌𝐚𝗀𝐞𝗌 𝗁𝐚𝗏𝐞 𝖻𝐞𝐞𝗇 𝗅𝐨𝗀𝗀𝐞𝖽 𝐢𝗇 𝗍𝗁𝐢𝗌 𝗍𝐚𝖻.";
      parent.appendChild(strong);
    }
  }
  // >>-|| FILTERING ||-<<
  sortMessagesByAge(map) {
    // sort direction: new - old
    map.sort((a, b) => {
      const recordA = this.messageRecord[a];
      const recordB = this.messageRecord[b];
      if (!recordA || !recordB) return 0;
      let timeA = new Date(recordA.message.timestamp).getTime();
      let timeB = new Date(recordB.message.timestamp).getTime();
      if (recordA.edit_history && typeof recordA.edit_history[recordA.edit_history.length - 1].time !== 'string') timeA = recordA.edit_history[recordA.edit_history.length - 1].time;
      if (recordB.edit_history && typeof recordB.edit_history[recordB.edit_history.length - 1].time !== 'string') timeB = recordB.edit_history[recordB.edit_history.length - 1].time;
      if (recordA.delete_data && recordA.delete_data.time) timeA = recordA.delete_data.time;
      if (recordB.delete_data && recordB.delete_data.time) timeB = recordB.delete_data.time;
      return parseInt(timeB) - parseInt(timeA);
    });
  }
  getFilteredMessages() {
    let messages = [];
    try {

    const pushIdsIntoMessages = map => {
      for (let channel in map) {
        for (let messageIdIDX in map[channel]) {
          messages.push(map[channel][messageIdIDX]);
        }
      }
    };
    const checkIsMentioned = map => {
      for (let channel in map) {
        for (let messageIdIDX in map[channel]) {
          const messageId = map[channel][messageIdIDX];
          const record = this.getSavedMessage(messageId);
          if (!record) continue;
          if (record.ghost_pinged) {
            messages.push(messageId);
          }
        }
      }
    };

    if (this.menu.selectedTab == 'sent') {
      for (let i of this.cachedMessageRecord) {
        messages.push(i.id);
      }
    }
    if (this.menu.selectedTab == 'edited') pushIdsIntoMessages(this.editedMessageRecord);
    if (this.menu.selectedTab == 'deleted') pushIdsIntoMessages(this.deletedMessageRecord);
    if (this.menu.selectedTab == 'purged') pushIdsIntoMessages(this.purgedMessageRecord);
    if (this.menu.selectedTab == 'ghostpings') {
      checkIsMentioned(this.deletedMessageRecord);
      checkIsMentioned(this.editedMessageRecord);
      checkIsMentioned(this.purgedMessageRecord);
    }
    if (this.menu.selectedTab == 'images') {
      // Collect from all records, then filter to only those with image attachments
      pushIdsIntoMessages(this.deletedMessageRecord);
      pushIdsIntoMessages(this.editedMessageRecord);
      pushIdsIntoMessages(this.purgedMessageRecord);
      // Deduplicate
      messages = [...new Set(messages)];
      // Filter to only messages with image attachments
      const imageRe = /\.(jpe?g|png|gif|bmp|webp)(?:$|\?)/i;
      messages = messages.filter(id => {
        const message = this.getMessageAny(id);
        if (!message) return false;
        if (Array.isArray(message.attachments) && message.attachments.length) {
          if (message.attachments.some(a => imageRe.test(a.filename || a.url || ''))) return true;
        }
        if (Array.isArray(message.embeds) && message.embeds.length) {
          if (message.embeds.some(e => !!e.image || !!e.thumbnail)) return true;
        }
        return false;
      });
    }
    if (this.menu.selectedTab == 'dms') {
      // Collect all, then filter to DMs only (no guild_id)
      pushIdsIntoMessages(this.deletedMessageRecord);
      pushIdsIntoMessages(this.editedMessageRecord);
      pushIdsIntoMessages(this.purgedMessageRecord);
      messages = [...new Set(messages)];
      messages = messages.filter(id => {
        const message = this.getMessageAny(id);
        if (!message) return false;
        const guildId = message.guild_id || (this.tools.getChannel(message.channel_id) || {}).guild_id;
        return !guildId;
      });
    }

    const filters = this.menu.filter.split(',');

    for (let i = 0; i < filters.length; i++) {
      const split = filters[i].split(':');
      if (split.length < 2) continue;

      const filterType = split[0].trim().toLowerCase();
      const filter = split[1].trim().toLowerCase();

      if (filterType == 'server' || filterType == 'guild')
        messages = messages.filter(x => {
          const message = this.getMessageAny(x);
          if (!message) return false;
          const channel = this.tools.getChannel(message.channel_id);
          const guild = this.tools.getServer(message.guild_id || (channel && channel.guild_id));
          return (message.guild_id || (channel && channel.guild_id)) == filter || (guild && guild.name.toLowerCase().includes(filter.toLowerCase()));
        });

      if (filterType == 'channel')
        messages = messages.filter(x => {
          const message = this.getMessageAny(x);
          if (!message) return false;
          const channel = this.tools.getChannel(message.channel_id);
          return message.channel_id == filter || (channel && channel.name.toLowerCase().includes(filter.replace('#', '').toLowerCase()));
        });

      if (filterType == 'message' || filterType == 'content')
        messages = messages.filter(x => {
          const message = this.getMessageAny(x);
          return x == filter || (message && message.content.toLowerCase().includes(filter.toLowerCase()));
        });

      if (filterType == 'user')
        messages = messages.filter(x => {
          const message = this.getMessageAny(x);
          if (!message) return false;
          const channel = this.tools.getChannel(message.channel_id);
          const member = ZeresPluginLibrary.DiscordModules.GuildMemberStore.getMember(message.guild_id || (channel && channel.guild_id), message.author.id);
          return message.author.id == filter || message.author.username.toLowerCase().includes(filter.toLowerCase()) || (member && member.nick && member.nick.toLowerCase().includes(filter.toLowerCase()));
        });

      if (filterType == 'has') {
        switch (filter) {
          case 'image':
            messages = messages.filter(x => {
              const message = this.getMessageAny(x);
              if (!message) return false;
              if (Array.isArray(message.attachments)) if (message.attachments.some(({ filename }) => ZeresPluginLibrary.DiscordModules.DiscordConstants.IMAGE_RE.test(filename))) return true;
              if (Array.isArray(message.embeds)) return message.embeds.some(({ image }) => !!image);
              return false;
            });
            break;
          case 'link':
            messages = messages.filter(x => {
              const message = this.getMessageAny(x);
              if (!message) return false;
              return message.content.search(/https?:\/\/[\w\W]{2,}/) !== -1;
            });
            break;
        }
      }
    }

    // Apply DMs server filter if set
    if (this.menu.serverFilter === 'dms') {
      messages = messages.filter(id => {
        const message = this.getMessageAny(id);
        if (!message) return false;
        const guildId = message.guild_id || (this.tools.getChannel(message.channel_id) || {}).guild_id;
        return !guildId;
      });
    }

    // Hide messages from blacklisted servers in the log viewer
    if (this.settings.blacklist && this.settings.blacklist.length) {
      messages = messages.filter(id => {
        const message = this.getMessageAny(id);
        if (!message) return false;
        const guildId = message.guild_id || (this.tools.getChannel(message.channel_id) || {}).guild_id;
        const channelId = message.channel_id;
        if (guildId && this.settings.blacklist.some(x => String(x) === String(guildId))) return false;
        if (this.settings.blacklist.some(x => String(x) === String(channelId))) return false;
        return true;
      });
    }

    if (this.menu.selectedTab != 'sent' && this.menu.selectedTab != 'images') {
      this.sortMessagesByAge(messages);
      if (this.settings.reverseOrder) messages.reverse();
    } else if (this.menu.selectedTab == 'images') {
      this.sortMessagesByAge(messages);
      if (this.settings.reverseOrder) messages.reverse();
    } else if (!this.settings.reverseOrder) messages.reverse();

    } catch (err) {
      console.error('[messageloggerfix] getFilteredMessages error:', err);
    }
    return messages;
  }
  // >>-|| REPOPULATE ||-<<
  refilterMessages() {
    try {
      const messagesDIV = document.getElementById(this.style.menuMessages);
      if (!messagesDIV) { console.warn('[messageloggerfix] menuMessages div not found'); return; }
      const original = messagesDIV.style.display;
      messagesDIV.style.display = 'none';
      while (messagesDIV.firstChild) messagesDIV.removeChild(messagesDIV.firstChild);
      this.menu.messages = this.getFilteredMessages();
      this.populateParent(messagesDIV, this.menu.messages);
      messagesDIV.style.display = original;
      // Auto-scroll to bottom (most recent messages)
      setTimeout(() => {
        const body = document.getElementById('mlf-modal-body');
        if (body) body.scrollTop = body.scrollHeight;
      }, 50);
    } catch (err) {
      console.error('[messageloggerfix] refilterMessages error:', err);
    }
  }
  // >>-|| HEADER ||-<<
  openTab(tab) {
    try {
      const tabBar = document.getElementById(this.style.menuTabBar);
      if (!tabBar) { console.warn('[messageloggerfix] tabBar not found'); return; }
      const currentSelected = tabBar.querySelector(`.${this.style.tabSelected}`);
      if (currentSelected) currentSelected.classList.remove(this.style.tabSelected);
      const newTab = tabBar.querySelector('#' + tab);
      if (newTab) newTab.classList.add(this.style.tabSelected);
      this.menu.selectedTab = tab;
      setTimeout(() => this.refilterMessages(), 0);
    } catch (err) {
      console.error('[messageloggerfix] openTab error:', err);
    }
  }
  createHeader() {
    if (!this.createHeader.classes || this.createHeader.classes.__errored) {
      try {
        const TabBarStuffs = ZeresPluginLibrary.WebpackModules.getByProps('body', 'tabBar');
        this.createHeader.classes = {
          itemTabBarItem: this.style.tabBarItem,
          tabBarContainer: this.style.tabBarContainer,
          tabBar: this.style.tabBar,
          tabBarSingle: this.style.tabBar
        };
      } catch {
        this.createHeader.classes = {
          itemTabBarItem: 'tabBarItem' + ' ' + 'item',
          tabBarContainer: 'tabBarContainer',
          tabBar: 'tabBar',
          tabBarSingle: 'tabBar',
          __errored: true
        };
      }
    }
    const classes = this.createHeader.classes;
    const createTab = (title, id) => {
      const tab = this.parseHTML(`<div id="${id}" class="${classes.itemTabBarItem} ${this.style.tab} ${id == this.menu.selectedTab ? this.style.tabSelected : ''}" role="button">${title}</div>`);
      tab.addEventListener('click', (e) => { e.stopPropagation(); this.openTab(id); });
      return tab;
    };
    const tabBar = this.parseHTML(`<div class="${classes.tabBarContainer}"><div class="${classes.tabBar}" id="${this.style.menuTabBar}"></div></div>`);
    const tabs = tabBar.getElementsByClassName(classes.tabBarSingle)[0];
    tabs.appendChild(createTab('\u2729 𝗌𝐞𝗇𝗍', 'sent'));
    tabs.appendChild(createTab('\ud83d\uddd1\ufe0f 𝖽𝐞𝗅𝐞𝗍𝐞𝖽', 'deleted'));
    tabs.appendChild(createTab('\u270f\ufe0f 𝐞𝖽𝐢𝗍𝐞𝖽', 'edited'));
    tabs.appendChild(createTab('\ud83c\udf2a\ufe0f 𝗉𝐮𝗋𝗀𝐞𝖽', 'purged'));
    tabs.appendChild(createTab('\ud83d\udc7b 𝗀𝗁𝐨𝗌𝗍 𝗉𝐢𝗇𝗀𝗌', 'ghostpings'));
    tabs.appendChild(createTab('\ud83c\udf1f 𝐢𝗆𝐚𝗀𝐞𝗌', 'images'));
    tabs.appendChild(createTab('\u2709\ufe0f 𝖽𝗆𝗌', 'dms'));
    tabBar.style.marginRight = '20px';
    return tabBar;
  }
  createTextBox() {
    const s = (el, styles) => { Object.assign(el.style, styles); return el; };
    const div = (id) => { const d = document.createElement('div'); if (id) d.id = id; return d; };
    const selectStyle = {
      background: 'rgba(13,10,26,0.7)',
      color: '#ccc',
      border: '1px solid rgba(212,175,55,0.15)', borderRadius: '4px',
      padding: '6px 8px', fontSize: '13px', cursor: 'pointer',
      outline: 'none', height: '32px', flex: '1', minWidth: '0',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
    };
    const labelStyle = {
      fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
      color: 'rgba(212,175,55,0.6)', marginBottom: '4px',
      letterSpacing: '0.5px'
    };

    // Hidden input to keep compatibility with existing filter system
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = this.style.filter;
    hiddenInput.value = this.menu.filter || '';

    // Build filter bar
    const filterBar = s(div(), {
      display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap',
      padding: '0', marginRight: '40px'
    });

    // --- Server dropdown ---
    const serverCol = s(div(), { display: 'flex', flexDirection: 'column', minWidth: '130px', flex: '1' });
    const serverLabel = document.createElement('div');
    Object.assign(serverLabel.style, labelStyle);
    serverLabel.textContent = '𝗌𝐞𝗋𝗏𝐞𝗋';
    serverCol.appendChild(serverLabel);
    const serverSelect = document.createElement('select');
    serverSelect.id = 'mlf-server-filter';
    Object.assign(serverSelect.style, selectStyle);
    const addOpt = (sel, val, text) => { const o = document.createElement('option'); o.value = val; o.textContent = text; sel.appendChild(o); };
    addOpt(serverSelect, '', '𝐚𝗅𝗅 𝗌𝐞𝗋𝗏𝐞𝗋𝗌');
    // Collect servers
    const serverMap = {};
    let hasDMs = false;
    const collectServers = (map) => {
      for (const channelId in map) {
        for (const msgId of map[channelId]) {
          const rec = this.messageRecord[msgId];
          if (!rec) continue;
          const guildId = rec.message.guild_id || (this.tools.getChannel(rec.message.channel_id) || {}).guild_id;
          if (guildId && !serverMap[guildId]) {
            const guild = this.tools.getServer(guildId);
            serverMap[guildId] = guild ? guild.name : guildId;
          }
          if (!guildId) hasDMs = true;
        }
      }
    };
    collectServers(this.deletedMessageRecord);
    collectServers(this.editedMessageRecord);
    collectServers(this.purgedMessageRecord);
    if (hasDMs) addOpt(serverSelect, 'dms', '𝖽𝗆𝗌');
    Object.entries(serverMap).sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, name]) => {
      addOpt(serverSelect, id, name.length > 20 ? name.substring(0, 18) + '...' : name);
    });
    serverCol.appendChild(serverSelect);
    filterBar.appendChild(serverCol);

    // --- Channel dropdown ---
    const channelCol = s(div(), { display: 'flex', flexDirection: 'column', minWidth: '130px', flex: '1' });
    const channelLabel = document.createElement('div');
    Object.assign(channelLabel.style, labelStyle);
    channelLabel.textContent = '𝖼𝗁𝐚𝗇𝗇𝐞𝗅';
    channelCol.appendChild(channelLabel);
    const channelSelect = document.createElement('select');
    channelSelect.id = 'mlf-channel-filter';
    Object.assign(channelSelect.style, selectStyle);
    addOpt(channelSelect, '', '𝐚𝗅𝗅 𝖼𝗁𝐚𝗇𝗇𝐞𝗅𝗌');
    // Populated dynamically when server changes
    channelCol.appendChild(channelSelect);
    filterBar.appendChild(channelCol);

    // --- User text input ---
    const userCol = s(div(), { display: 'flex', flexDirection: 'column', minWidth: '120px', flex: '1' });
    const userLabel = document.createElement('div');
    Object.assign(userLabel.style, labelStyle);
    userLabel.textContent = '𝐮𝗌𝐞𝗋';
    userCol.appendChild(userLabel);
    const userInput = document.createElement('input');
    userInput.type = 'text';
    userInput.placeholder = '𝐚𝗇𝗒 𝐮𝗌𝐞𝗋';
    Object.assign(userInput.style, selectStyle);
    userInput.style.padding = '6px 10px';
    userCol.appendChild(userInput);
    filterBar.appendChild(userCol);

    // --- Search text input ---
    const searchCol = s(div(), { display: 'flex', flexDirection: 'column', minWidth: '140px', flex: '1.5' });
    const searchLabel = document.createElement('div');
    Object.assign(searchLabel.style, labelStyle);
    searchLabel.textContent = '𝗌𝐞𝐚𝗋𝖼𝗁';
    searchCol.appendChild(searchLabel);
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '𝗌𝐞𝐚𝗋𝖼𝗁 𝗆𝐞𝗌𝗌𝐚𝗀𝐞𝗌...';
    Object.assign(searchInput.style, selectStyle);
    searchInput.style.padding = '6px 10px';
    searchCol.appendChild(searchInput);
    filterBar.appendChild(searchCol);

    // --- Has dropdown ---
    const hasCol = s(div(), { display: 'flex', flexDirection: 'column', minWidth: '90px', flex: '0.7' });
    const hasLabel = document.createElement('div');
    Object.assign(hasLabel.style, labelStyle);
    hasLabel.textContent = '𝖼𝐨𝗇𝗍𝐚𝐢𝗇𝗌';
    hasCol.appendChild(hasLabel);
    const hasSelect = document.createElement('select');
    Object.assign(hasSelect.style, selectStyle);
    addOpt(hasSelect, '', '𝐚𝗇𝗒𝗍𝗁𝐢𝗇𝗀');
    addOpt(hasSelect, 'image', '𝐢𝗆𝐚𝗀𝐞𝗌');
    addOpt(hasSelect, 'link', '𝗅𝐢𝗇𝗄𝗌');
    hasCol.appendChild(hasSelect);
    filterBar.appendChild(hasCol);

    // --- Populate channels based on server ---
    const populateChannels = (serverId) => {
      while (channelSelect.options.length > 1) channelSelect.remove(1);
      const channelMap = {};
      const scanMap = (map) => {
        for (const chId in map) {
          for (const msgId of map[chId]) {
            const rec = this.messageRecord[msgId];
            if (!rec) continue;
            const guildId = rec.message.guild_id || (this.tools.getChannel(rec.message.channel_id) || {}).guild_id;
            if (serverId === 'dms' && guildId) continue;
            if (serverId && serverId !== 'dms' && guildId !== serverId) continue;
            if (!serverId) {} // all
            const ch = this.tools.getChannel(rec.message.channel_id);
            if (ch && !channelMap[ch.id]) channelMap[ch.id] = ch.name || ch.id;
          }
        }
      };
      scanMap(this.deletedMessageRecord);
      scanMap(this.editedMessageRecord);
      scanMap(this.purgedMessageRecord);
      Object.entries(channelMap).sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, name]) => {
        addOpt(channelSelect, id, '#' + (name.length > 18 ? name.substring(0, 16) + '...' : name));
      });
    };
    populateChannels('');

    // --- Build filter string from UI and trigger refilter ---
    const applyFilters = () => {
      const parts = [];
      const sv = serverSelect.value;
      const ch = channelSelect.value;
      const us = userInput.value.trim();
      const sr = searchInput.value.trim();
      const hs = hasSelect.value;

      if (sv && sv !== 'dms') parts.push('server: ' + sv);
      if (ch) parts.push('channel: ' + ch);
      if (us) parts.push('user: ' + us);
      if (sr) parts.push('message: ' + sr);
      if (hs) parts.push('has: ' + hs);

      this.menu.serverFilter = sv === 'dms' ? 'dms' : '';
      this.menu.filter = parts.join(', ');
      hiddenInput.value = this.menu.filter;
      this.refilterMessages();
    };

    serverSelect.addEventListener('change', () => {
      populateChannels(serverSelect.value);
      channelSelect.value = '';
      applyFilters();
    });
    channelSelect.addEventListener('change', applyFilters);
    hasSelect.addEventListener('change', applyFilters);

    let userTimeout, searchTimeout;
    userInput.addEventListener('input', () => {
      clearTimeout(userTimeout);
      userTimeout = setTimeout(applyFilters, 300);
    });
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, 300);
    });

    filterBar.appendChild(hiddenInput);
    return filterBar;
  }
  // >>-|| MENU MODAL CREATION ||-<<
  openWindow(type) {
    if (this.menu.open) {
      this.menu.scrollPosition = 0;
      if (type) this.openTab(type);
      return;
    }
    this.menu.open = true;
    this.menu.serverFilter = '';
    if (type) this.menu.selectedTab = type;
    if (!this.menu.selectedTab) this.menu.selectedTab = 'deleted';
    const messagesDIV = this.parseHTML(`<div id="${this.style.menuMessages}"></div>`);
    //messagesDIV.style.display = 'none';
    const onChangeOrder = el => {
      this.settings.reverseOrder = !this.settings.reverseOrder;
      el.target.innerText = '𝗌𝐨𝗋𝗍 𝖽𝐢𝗋𝐞𝖼𝗍𝐢𝐨𝗇: ' + (!this.settings.reverseOrder ? '𝗇𝐞𝗐 - 𝐨𝗅𝖽' : '𝐨𝗅𝖽 - 𝗇𝐞𝗐'); // maybe a func?
      this.saveSettings();
      this.refilterMessages();
    };

    const onClearLog = e => {
      let type = this.menu.selectedTab;
      if (type === 'ghostpings') type = '𝗀𝗁𝐨𝗌𝗍 𝗉𝐢𝗇𝗀𝗌';
      else if (type === 'dms') type = '𝖽𝗆 𝗆𝐞𝗌𝗌𝐚𝗀𝐞𝗌';
      else type = type + ' 𝗆𝐞𝗌𝗌𝐚𝗀𝐞𝗌';

      this.showClearConfirmation(`𝐚𝗅𝗅 ${type}${this.menu.filter.length ? ' 𝗆𝐚𝗍𝖼𝗁𝐢𝗇𝗀 𝖿𝐢𝗅𝗍𝐞𝗋' : ''}`, () => {
            if (this.menu.selectedTab == 'sent') {
              if (!this.menu.filter.length)
                for (let id of this.menu.messages)
                  this.cachedMessageRecord.splice(
                    this.cachedMessageRecord.findIndex(m => m.id === id),
                    1
                  );
              else this.cachedMessageRecord.length = 0; // hack, does it cause a memory leak?
            } else {
              for (let id of this.menu.messages) {
                const record = this.messageRecord[id];
                let isSelected = false;
                if (record) {
                  this.invalidateChannelCache(record.message.channel_id);
                  if (this.selectedChannel) isSelected = record.message.channel_id === this.selectedChannel.id;
                }
                this.deleteMessageFromRecords(id);
                if (this.selectedChannel && isSelected) this.cacheChannelMessages(this.selectedChannel.id);
              }
              this.saveData();
            }
            setImmediate(_ => this.refilterMessages());
      });
    };

    // unfortunately the BdApi.UI.showConfirmationModal doesn't support what I have in mind here, so this will have to stay
    // more specifically, does not support overriding what the confirm and cancel buttons do entirely
    // they inadvertently close the modal which is not the intended functionality
    this.createModal(
      {
        confirmText: '𝖼𝗅𝐞𝐚𝗋 𝗅𝐨𝗀',
        cancelText: '𝗌𝐨𝗋𝗍 𝖽𝐢𝗋𝐞𝖼𝗍𝐢𝐨𝗇: ' + (!this.settings.reverseOrder ? '𝗇𝐞𝗐 - 𝐨𝗅𝖽' : '𝐨𝗅𝖽 - 𝗇𝐞𝗐'),
        header: ZeresPluginLibrary.ReactTools.createWrappedElement([this.createHeader(), this.createTextBox()]),
        className: this.style.menuModalLarge,
        children: [ZeresPluginLibrary.ReactTools.createWrappedElement([messagesDIV])],
        onCancel: onChangeOrder,
        onConfirm: onClearLog,
        onClose: _ => { },
        ml2Data: true,
        className: this.style.menuRoot,
        ref: e => {
          if (!e) return;
          try {
            const scrollContainer = e.closest ? e.closest('[class*="modal"]') : null;
            const scrollTarget = scrollContainer ? scrollContainer.querySelector('[class*="content"]') : null;
            if (scrollTarget) {
              scrollTarget.addEventListener(
                'scroll',
                this.tools.DiscordUtils.debounce(() => {
                  const menuMessages = document.getElementById(this.style.menuMessages);
                  if (menuMessages) this.scrollPosition = menuMessages.parentElement.parentElement.parentElement.scrollTop;
                }, 100)
              );
            }
          } catch (err) {
            ZeresPluginLibrary.Logger.warn(this.getName(), 'Failed to attach scroll listener', err);
          }
        }
      },
      false,
      this.style.menu
    );
    let loadAttempts = 0;
    const loadMessages = () => {
      loadAttempts++;
      try {
        this.refilterMessages();
      } catch (e) {
        if (loadAttempts > 4) {
          XenoLib.Notifications.error(`Couldn't load menu messages! Report this issue to missspelll, error info is in console`, { timeout: 0 });
          ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Failed loading menu', e);
          return;
        }
        setTimeout(loadMessages, 100);
      }
    };
    setTimeout(loadMessages, 100);
  }
  /* ==================================================-|| END MENU ||-================================================== */
  /* ==================================================-|| START CONTEXT MENU ||-================================================== */
  patchContextMenus() {
    const _this = this;

    this.unpatches.push(BdApi.ContextMenu.patch('message', (ret, props) => {
      const menu = ZeresPluginLibrary.Utilities.getNestedProp(
        ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.navId === 'message'),
        'children'
      );
      if (!Array.isArray(menu)) return;

      const newItems = [];
      const addElement = (label, action, options = {}) => newItems.push({ label, action, ...options });

      addElement('𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌', () => this.openWindow());

      const messageId = props.message.id;
      const channelId = props.channel.id;
      const record = this.messageRecord[messageId];
      if (record) {
        /*
                addElement('Show in menu', () => {
                    this.menu.filter = `message:${messageId}`;
                    this.openWindow();
                }); */
        if (record.delete_data) {
          const options = menu.find(m => m.props.children && m.props.children.length > 10);
          options.props.children.splice(0, options.props.children.length);
          addElement(
            'Hide Deleted Message',
            () => {
              this.dispatcher.dispatch({
                type: 'MESSAGE_DELETE',
                id: messageId,
                channelId: channelId,
                ML: true // ignore ourselves lol, it's already deleted
                // on a side note, probably does nothing if we don't ignore
              });
              this.showToast('Hidden!', { type: 'success' });
              record.delete_data.hidden = true;
              this.saveData();
            }
          );
          const idx = this.noTintIds.indexOf(messageId);
          addElement(
            `${idx !== -1 ? 'Add' : 'Remove'} Deleted Tint`,
            () => {
              if (idx !== -1) this.noTintIds.splice(idx, 1);
              else this.noTintIds.push(messageId);
              this.showToast(idx !== -1 ? 'Added!' : 'Removed!', { type: 'success' });
            }
          );
        }
        if (record.edit_history) {
          if (record.edits_hidden) {
            addElement(
              'Unhide Edits',
              () => {
                record.edits_hidden = false;
                this.saveData();
                this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
              }
            );
          } else {
            let target = props.target;
            if (target) {
              while (target && target.className && target.className.indexOf(this.style.edited) === -1) {
                target = target.parentElement;
              }
              if (target) {
                const modifiers = this.editModifiers[messageId];
                const editNum = target.getAttribute('editNum');
                if (modifiers?.editNum) {
                  addElement(
                    `${modifiers.noSuffix ? 'Show' : 'Hide'} (edited) Tag`,
                    () => {
                      modifiers.noSuffix = true;
                      this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                    }
                  );
                  addElement(
                    `Undo Show As Message`,
                    () => {
                      delete modifiers.editNum;
                      if (!Object.keys(modifiers).length) delete this.editModifiers[messageId];
                      this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                    },
                    this.obfuscatedClass('undo-show-as-message')
                  );
                } else {
                  if (typeof editNum !== 'undefined' && editNum !== null) {
                    addElement(
                      'Show Edit As Message',
                      () => {
                        if (modifiers) modifiers.editNum = parseInt(editNum);
                        else this.editModifiers[messageId] = { editNum };
                        this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                      }
                    );
                    addElement(
                      'Delete Edit',
                      () => {
                        this.deleteEditedMessageFromRecord(messageId, parseInt(editNum));
                        this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                      },
                      { color: 'danger' }
                    );
                  }
                  if (this.settings.showEditedMessages) {
                    addElement(
                      'Hide Edits',
                      () => {
                        record.edits_hidden = true;
                        this.saveData();
                        this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                      }
                    );
                  }

                  if (modifiers?.showAllEdits) {
                    addElement(
                      'Undo show all edits',
                      () => {
                        delete modifiers.showAllEdits;
                        if (!Object.keys(modifiers).length) delete this.editModifiers[messageId];
                        this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                      },
                      this.obfuscatedClass('undo-show-all-edits')
                    )
                  } else if (this.settings.maxShownEdits && record.edit_history.length > this.settings.maxShownEdits) {
                    addElement(
                      'Show All Edits',
                      () => {
                        this.editModifiers[messageId] = { showAllEdits: true };
                        this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                      }
                    );
                  }
                }
              }
            }
          }
        }
        if (record) {
          addElement(
            'Remove From Log',
            () => {
              this.deleteMessageFromRecords(messageId);
              this.saveData();
              if (record.delete_data) {
                this.dispatcher.dispatch({
                  type: 'MESSAGE_DELETE',
                  id: messageId,
                  channelId: channelId,
                  ML: true // ignore ourselves lol, it's already deleted
                  // on a side note, probably does nothing if we don't ignore
                });
              } else {
                this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
              }
            },
            { color: 'danger' }
          );
        }
      }

      menu.push(BdApi.ContextMenu.buildMenuChildren([{
        type: 'group',
        items: [{
          type: 'submenu',
          label: this.settings.contextmenuSubmenuName,
          items: newItems
        }]
      }]));
    }));

    const handleWhiteBlackList = (newItems, id) => {
      id = String(id);
      const addElement = (label, action, options = {}) => newItems.push({ label, action, ...options });
      const isBlocked = this.settings.blacklist.some(x => String(x) === id);

      // Single toggle: block or unblock
      addElement(
        isBlocked ? '\u2705 Unblock (start logging)' : '\ud83d\udeab Block (stop logging)',
        () => {
          if (isBlocked) {
            const bIdx = this.settings.blacklist.findIndex(x => String(x) === id);
            if (bIdx !== -1) this.settings.blacklist.splice(bIdx, 1);
            this.showToast('Unblocked! Messages will be logged.', { type: 'success' });
          } else {
            // Remove from whitelist if present
            const wIdx = this.settings.whitelist.findIndex(x => String(x) === id);
            if (wIdx !== -1) this.settings.whitelist.splice(wIdx, 1);
            this.settings.blacklist.push(id);
            this.showToast('Blocked! Messages will not be logged.', { type: 'success' });
          }
          this.saveSettings();
        },
        isBlocked ? {} : { color: 'danger' }
      );

      addElement(
        '\u2699\ufe0f Manage All Lists',
        () => {
          this.closeContextMenu();
          this.showManageListsModal();
        }
      );
    };

    this.unpatches.push(BdApi.ContextMenu.patch('channel-context', (ret, props) => {
      if (props.channel.type === 4) return; // categories
      const menu = ZeresPluginLibrary.Utilities.getNestedProp(
        ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.navId === 'channel-context'),
        'children'
      );
      if (!Array.isArray(menu)) return;

      const newItems = [];
      const addElement = (label, action, options = {}) => newItems.push({ label, action, ...options });

      addElement('𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌', () => this.openWindow());
      handleWhiteBlackList(newItems, props.channel.id);

      menu.push(BdApi.ContextMenu.buildMenuChildren([{
        type: 'group',
        items: [{
          type: 'submenu',
          label: this.settings.contextmenuSubmenuName,
          items: newItems
        }]
      }]));
    }));

    this.unpatches.push(BdApi.ContextMenu.patch('guild-context', (ret, props) => {
      const menu = ZeresPluginLibrary.Utilities.getNestedProp(
        ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.navId === 'guild-context'),
        'children'
      );
      if (!Array.isArray(menu)) return;

      const newItems = [];
      const addElement = (label, action, options = {}) => newItems.push({ label, action, ...options });

      addElement('𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌', () => this.openWindow());

      handleWhiteBlackList(newItems, props.guild.id);

      menu.push(BdApi.ContextMenu.buildMenuChildren([{
        type: 'group',
        items: [{
          type: 'submenu',
          label: this.settings.contextmenuSubmenuName,
          items: newItems
        }]
      }]));
    }));

    this.unpatches.push(BdApi.ContextMenu.patch('user-context', (ret, props) => {
      const menu = ZeresPluginLibrary.Utilities.getNestedProp(
        ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.navId === 'user-context'),
        'children'
      );
      if (!Array.isArray(menu)) return;

      const newItems = [];
      const addElement = (label, action, options = {}) => newItems.push({ label, action, ...options });

      addElement('𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌', () => this.openWindow());

      if (props.channel?.isDM()) {
        handleWhiteBlackList(newItems, props.channel.id);
      }

      menu.push(BdApi.ContextMenu.buildMenuChildren([{
        type: 'group',
        items: [{
          type: 'submenu',
          label: this.settings.contextmenuSubmenuName,
          items: newItems
        }]
      }]));
    }));

    this.unpatches.push(BdApi.ContextMenu.patch('gdm-context', (ret, props) => {
      const menu = ZeresPluginLibrary.Utilities.getNestedProp(
        ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.navId === 'gdm-context'),
        'children'
      );
      if (!Array.isArray(menu)) return;

      const newItems = [];
      const addElement = (label, action, options = {}) => newItems.push({ label, action, ...options });

      addElement('𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌', () => this.openWindow());
      handleWhiteBlackList(newItems, props.channel.id);

      menu.push(BdApi.ContextMenu.buildMenuChildren([{
        type: 'group',
        items: [{
          type: 'submenu',
          label: this.settings.contextmenuSubmenuName,
          items: newItems
        }]
      }]));
    }));

    this.unpatches.push(BdApi.ContextMenu.patch('image-context', (ret, props) => {
      const menu = ZeresPluginLibrary.Utilities.getNestedProp(
        ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.navId === 'image-context'),
        'children'
      );
      if (!Array.isArray(menu)) return;

      const newItems = [];
      const addElement = (label, action, options = {}) => newItems.push({ label, action, ...options });
      let matched;
      let isCached = false;
      if (!props.src) return;
      if (props.src.startsWith('data:image/png')) {
        const cut = props.src.substr(0, 100);
        matched = cut.match(/;(\d+);(\d+);/);
        isCached = true;
      } else {
        matched = props.src.match(/.*ments\/(\d+)\/(\d+)\//);
        if (!matched) matched = props.src.match(/r8q6.png#(\d+),(\d+)/);
        if (!matched) {
          matched = props.src.match(/localhost:7474.*#(\d+),(\d+)/);
          isCached = true;
        }
      }
      if (!matched) return;
      const channelId = matched[1];
      const attachmentId = matched[2];
      const element = document.getElementById(attachmentId);
      if (!element) return;
      const attachmentIdx = element.idx;
      const record = this.getSavedMessage(element.messageId);
      if (!record) return;
      addElement(
        'Save Image',
        () => {
          try {
            const url = record.message.attachments[attachmentIdx].url;
            if (url && url !== 'ERROR') {
              window.open(url, '_blank');
            } else {
              const srcFile = `${this.settings.imageCacheDir}/${attachmentId}${record.message.attachments[attachmentIdx].filename.match(/\.[0-9a-z]+$/)[0]}`;
              if (!this.nodeModules.fs.existsSync(srcFile)) return this.showToast('Image does not exist locally!', { type: 'error', timeout: 5000 });
              try {
                require('electron').shell.showItemInFolder(srcFile);
              } catch(e) {
                this.showToast('Cannot open file browser in this environment', { type: 'error' });
              }
            }
          } catch (err) {
            console.error('Failed saving', err.message);
          }
        }
      );
      addElement(
        'Copy to Clipboard',
        () => {
          const url = record.message.attachments[attachmentIdx].url;
          if (url && url !== 'ERROR') {
            fetch(url).then(res => res.blob()).then(blob => {
              try {
                const item = new ClipboardItem({ [blob.type]: blob });
                navigator.clipboard.write([item]).then(
                  () => this.showToast('Copied!', { type: 'success' }),
                  () => {
                    navigator.clipboard.writeText(url).then(
                      () => this.showToast('Copied URL!', { type: 'success' }),
                      () => this.showToast('Failed to copy!', { type: 'error' })
                    );
                  }
                );
              } catch (err) {
                navigator.clipboard.writeText(url).then(
                  () => this.showToast('Copied URL!', { type: 'success' }),
                  () => this.showToast('Failed to copy!', { type: 'error' })
                );
              }
            }).catch(() => this.showToast('Failed to copy!', { type: 'error' }));
          } else {
            this.showToast('Image not available for copying!', { type: 'error' });
          }
        }
      );
      addElement(
        'Jump to Message',
        () => {
          this.jumpToMessage(channelId, element.messageId, record.message.guild_id);
        },
        this.obfuscatedClass('jump-to')
      );
      if (record.delete_data && record.delete_data.hidden) {
        addElement(
          'Unhide Deleted Message',
          () => {
            record.delete_data.hidden = false;
            this.invalidateChannelCache(record.message.channel_id); // good idea?
            this.cacheChannelMessages(record.message.channel_id);
            this.saveData();
            this.showToast('Unhidden!', { type: 'success' });
          },
          this.obfuscatedClass('unhide-deleted')
        );
      }
      if (record.edit_history && record.edits_hidden) {
        addElement(
          'Unhide Message History',
          () => {
            record.edits_hidden = false;
            this.invalidateChannelCache(record.message.channel_id); // good idea?
            this.cacheChannelMessages(record.message.channel_id);
            this.saveData();
            this.showToast('Unhidden!', { type: 'success' });
          },
          this.obfuscatedClass('unhide-edited')
        );
      }
      addElement(
        'Remove From Log',
        () => {
          this.deleteMessageFromRecords(element.messageId);
          this.refilterMessages(); // I don't like calling that, maybe figure out a way to animate it collapsing on itself smoothly
          this.saveData();
          if (record.delete_data) this.dispatcher.dispatch({ type: 'MESSAGE_DELETE', id: messageId, channelId: channelId, ML: true });
          else this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
        },
        this.obfuscatedClass('remove')
      );
      if (!props.src.startsWith('https://i.clouds.tf/q2vy/r8q6.png')) {
        addElement(
          'Hide Image From Log',
          () => {
            record.message.attachments[attachmentIdx].hidden = true;
            element.src = `https://i.clouds.tf/q2vy/r8q6.png#${channelId},${attachmentId}`;
            element.width = 200;
          },
          this.obfuscatedClass('hide-image')
        );
      } else {
        addElement(
          'Unhide Image From Log',
          () => {
            record.message.attachments[attachmentIdx].hidden = false;
            const srcFile = `http://localhost:7474/${attachmentId}${record.message.attachments[attachmentIdx].filename.match(/\.[0-9a-z]+$/)[0]}#${channelId},${attachmentId}`;
            element.src = record.message.attachments[attachmentIdx].url === 'ERROR' ? srcFile : record.message.attachments[attachmentIdx].url;
            element.width = record.message.attachments[attachmentIdx].url === 'ERROR' ? 256 : this.clamp(record.message.attachments[attachmentIdx].width, 200, 650);
          },
          this.obfuscatedClass('unhide-image')
        );
      }

      menu.push(BdApi.ContextMenu.buildMenuChildren([{
        type: 'group',
        items: [{
          type: 'submenu',
          label: this.settings.contextmenuSubmenuName,
          items: newItems
        }]
      }]));
    }));

    return;
    const Patcher = XenoLib.createSmartPatcher({ before: (moduleToPatch, functionName, callback, options = {}) => ZeresPluginLibrary.Patcher.before(this.getName(), moduleToPatch, functionName, callback, options), instead: (moduleToPatch, functionName, callback, options = {}) => ZeresPluginLibrary.Patcher.instead(this.getName(), moduleToPatch, functionName, callback, options), after: (moduleToPatch, functionName, callback, options = {}) => ZeresPluginLibrary.Patcher.after(this.getName(), moduleToPatch, functionName, callback, options), unpatchAll: () => ZeresPluginLibrary.Patcher.unpatchAll(this.getName()) });
    const WebpackModules = ZeresPluginLibrary.WebpackModules;
    const nativeImageContextMenuPatch = () => {
      const mod = WebpackModules.find(e => e.default && (e.__powercordOriginal_default || e.default).displayName === 'NativeImageContextMenu');
      if (!mod) return console.error('Failed to patch NativeImageContextMenu');
      this.unpatches.push(
        this.Patcher.after(
          mod,
          'default',
          (_, [props], ret) => {
            const newItems = [];
            if (!this.menu.open) return;
            const menu = ZeresPluginLibrary.Utilities.getNestedProp(
              ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.type && e.type.displayName === 'Menu'),
              'props.children'
            );
            if (!Array.isArray(menu)) return;
            const addElement = (label, callback, id, options = {}) => newItems.push(XenoLib.createContextMenuItem(label, callback, id, options));
            let matched;
            let isCached = false;
            if (!props.src) return;
            if (props.src.startsWith('data:image/png')) {
              const cut = props.src.substr(0, 100);
              matched = cut.match(/;(\d+);(\d+);/);
              isCached = true;
            } else {
              matched = props.src.match(/.*ments\/(\d+)\/(\d+)\//);
              if (!matched) matched = props.src.match(/r8q6.png#(\d+),(\d+)/);
              if (!matched) {
                matched = props.src.match(/localhost:7474.*#(\d+),(\d+)/);
                isCached = true;
              }
            }
            if (!matched) return;
            const channelId = matched[1];
            const attachmentId = matched[2];
            const element = document.getElementById(attachmentId);
            if (!element) return;
            const attachmentIdx = element.idx;
            const record = this.getSavedMessage(element.messageId);
            if (!record) return;
            addElement(
              'Save to Folder',
              () => {
                const { dialog } = this.nodeModules.electron.remote;
                dialog
                  .showSaveDialog({
                    defaultPath: record.message.attachments[attachmentIdx].filename
                  })
                  .then(({ filePath: dir }) => {
                    try {
                      if (!dir) return;
                      const attemptToUseCached = () => {
                        const srcFile = `${this.settings.imageCacheDir}/${attachmentId}${record.message.attachments[attachmentIdx].filename.match(/\.[0-9a-z]+$/)[0]}`;
                        if (!this.nodeModules.fs.existsSync(srcFile)) return this.showToast('Image does not exist locally!', { type: 'error', timeout: 5000 });
                        this.nodeModules.fs.copyFileSync(srcFile, dir);
                        this.showToast('Saved!', { type: 'success' });
                      };
                      if (isCached) {
                        attemptToUseCached();
                      } else {
                        const req = this.nodeModules.request(record.message.attachments[attachmentIdx].url);
                        req.on('response', res => {
                          if (res.statusCode == 200) {
                            req
                              .pipe(this.nodeModules.fs.createWriteStream(dir))
                              .on('finish', () => this.showToast('Saved!', { type: 'success' }))
                              .on('error', () => this.showToast('Failed to save! No permissions.', { type: 'error', timeout: 5000 }));
                          } else if (res.statusCode == 404) {
                            attemptToUseCached();
                          } else {
                            attemptToUseCached();
                          }
                        });
                      }
                    } catch (err) {
                      console.error('Failed saving', err.message);
                    }
                  });
              },
              this.obfuscatedClass('save-to')
            );
            addElement(
              'Copy to Clipboard',
              () => {
                const { clipboard, nativeImage } = this.nodeModules.electron;
                const attemptToUseCached = () => {
                  const srcFile = `${this.settings.imageCacheDir}/${attachmentId}${record.message.attachments[attachmentIdx].filename.match(/\.[0-9a-z]+$/)[0]}`;
                  if (!this.nodeModules.fs.existsSync(srcFile)) return this.showToast('Image does not exist locally!', { type: 'error', timeout: 5000 });
                  clipboard.write({ image: srcFile });
                  this.showToast('Copied!', { type: 'success' });
                };
                if (isCached) {
                  attemptToUseCached();
                } else {
                  const path = this.nodeModules.path;
                  const process = require('process');
                  // ImageToClipboard by Zerebos
                  this.nodeModules.request({ url: record.message.attachments[attachmentIdx].url, encoding: null }, (error, response, buffer) => {
                    try {
                      if (error || response.statusCode != 200) {
                        this.showToast('Failed to copy. Image may not exist. Attempting to use local image cache.', { type: 'error' });
                        attemptToUseCached();
                        return;
                      }
                      if (process.platform === 'win32' || process.platform === 'darwin') {
                        clipboard.write({ image: nativeImage.createFromBuffer(buffer) });
                      } else {
                        const file = path.join(process.env.HOME, 'ml2temp.png');
                        this.nodeModules.fs.writeFileSync(file, buffer, { encoding: null });
                        clipboard.write({ image: file });
                        this.nodeModules.fs.unlinkSync(file);
                      }
                      this.showToast('Copied!', { type: 'success' });
                    } catch (err) {
                      console.error('Failed to cached', err.message);
                    }
                  });
                }
              },
              this.obfuscatedClass('copy-to')
            );
            addElement(
              'Jump to Message',
              () => {
                this.jumpToMessage(channelId, element.messageId, record.message.guild_id);
              },
              this.obfuscatedClass('jump-to')
            );
            if (record.delete_data && record.delete_data.hidden) {
              addElement(
                'Unhide Deleted Message',
                () => {
                  record.delete_data.hidden = false;
                  this.invalidateChannelCache(record.message.channel_id); // good idea?
                  this.cacheChannelMessages(record.message.channel_id);
                  this.saveData();
                  this.showToast('Unhidden!', { type: 'success' });
                },
                this.obfuscatedClass('unhide-deleted')
              );
            }
            if (record.edit_history && record.edits_hidden) {
              addElement(
                'Unhide Message History',
                () => {
                  record.edits_hidden = false;
                  this.invalidateChannelCache(record.message.channel_id); // good idea?
                  this.cacheChannelMessages(record.message.channel_id);
                  this.saveData();
                  this.showToast('Unhidden!', { type: 'success' });
                },
                this.obfuscatedClass('unhide-edited')
              );
            }
            addElement(
              'Remove From Log',
              () => {
                this.deleteMessageFromRecords(element.messageId);
                this.refilterMessages(); // I don't like calling that, maybe figure out a way to animate it collapsing on itself smoothly
                this.saveData();
                if (record.delete_data) this.dispatcher.dispatch({ type: 'MESSAGE_DELETE', id: messageId, channelId: channelId, ML: true });
                else this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
              },
              this.obfuscatedClass('remove')
            );
            if (!props.src.startsWith('https://i.clouds.tf/q2vy/r8q6.png')) {
              addElement(
                'Hide Image From Log',
                () => {
                  record.message.attachments[attachmentIdx].hidden = true;
                  element.src = `https://i.clouds.tf/q2vy/r8q6.png#${channelId},${attachmentId}`;
                  element.width = 200;
                },
                this.obfuscatedClass('hide-image')
              );
            } else {
              addElement(
                'Unhide Image From Log',
                () => {
                  record.message.attachments[attachmentIdx].hidden = false;
                  const srcFile = `http://localhost:7474/${attachmentId}${record.message.attachments[attachmentIdx].filename.match(/\.[0-9a-z]+$/)[0]}#${channelId},${attachmentId}`;
                  element.src = record.message.attachments[attachmentIdx].url === 'ERROR' ? srcFile : record.message.attachments[attachmentIdx].url;
                  element.width = record.message.attachments[attachmentIdx].url === 'ERROR' ? 256 : this.clamp(record.message.attachments[attachmentIdx].width, 200, 650);
                },
                this.obfuscatedClass('unhide-image')
              );
            }
            if (!newItems.length) return;
            menu.push(XenoLib.createContextMenuGroup([XenoLib.createContextMenuSubMenu(this.settings.contextmenuSubmenuName, newItems, this.obfuscatedClass('mlv2'))]));
          }
        )
      );
    }
    this.unpatches.push(XenoLib.listenLazyContextMenu('NativeImageContextMenu', nativeImageContextMenuPatch));

    const messageContextPatch = () => {
      const mod = WebpackModules.find(e => e.default && (e.__powercordOriginal_default || e.default).displayName === 'MessageContextMenu');
      if (!mod) return console.error('[messageloggerfix] Failed to find MessageContextMenu');
      this.unpatches.push(
        this.Patcher.after(
          mod,
          'default',
          (_, [props], ret) => {
            const newItems = [];
            const menu = ZeresPluginLibrary.Utilities.getNestedProp(
              ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.type && e.type.displayName === 'Menu'),
              'props.children'
            );
            if (!Array.isArray(menu)) return;
            const addElement = (label, callback, id, options = {}) => newItems.push(XenoLib.createContextMenuItem(label, callback, id, options));
            addElement('𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌', () => this.openWindow(), this.obfuscatedClass('open'));
            const messageId = props.message.id;
            const channelId = props.channel.id;
            const record = this.messageRecord[messageId];
            if (record) {
              /*
                      addElement('Show in menu', () => {
                          this.menu.filter = `message:${messageId}`;
                          this.openWindow();
                      }); */
              if (record.delete_data) {
                const options = menu.find(m => m.props.children && m.props.children.length > 10);
                options.props.children.splice(0, options.props.children.length);
                addElement(
                  'Hide Deleted Message',
                  () => {
                    this.dispatcher.dispatch({
                      type: 'MESSAGE_DELETE',
                      id: messageId,
                      channelId: channelId,
                      ML: true // ignore ourselves lol, it's already deleted
                      // on a side note, probably does nothing if we don't ignore
                    });
                    this.showToast('Hidden!', { type: 'success' });
                    record.delete_data.hidden = true;
                    this.saveData();
                  },
                  this.obfuscatedClass('hide-deleted')
                );
                const idx = this.noTintIds.indexOf(messageId);
                addElement(
                  `${idx !== -1 ? 'Add' : 'Remove'} Deleted Tint`,
                  () => {
                    if (idx !== -1) this.noTintIds.splice(idx, 1);
                    else this.noTintIds.push(messageId);
                    this.showToast(idx !== -1 ? 'Added!' : 'Removed!', { type: 'success' });
                  },
                  this.obfuscatedClass('change-tint')
                );
              }
              if (record.edit_history) {
                if (record.edits_hidden) {
                  addElement(
                    'Unhide Edits',
                    () => {
                      record.edits_hidden = false;
                      this.saveData();
                      this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                    },
                    this.obfuscatedClass('unhide-edits')
                  );
                } else {
                  let target = props.target;
                  if (target) {
                    while (target && target.className && target.className.indexOf(this.style.edited) === -1) {
                      target = target.parentElement;
                    }
                    if (target) {
                      if (!this.editModifiers[messageId]) {
                        addElement(
                          'Hide Edits',
                          () => {
                            record.edits_hidden = true;
                            this.saveData();
                            this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                          },
                          this.obfuscatedClass('hide-edits')
                        );
                      }
                      const editNum = target.getAttribute('editNum');
                      if (this.editModifiers[messageId]) {
                        addElement(
                          `${this.editModifiers[messageId].noSuffix ? 'Show' : 'Hide'} (edited) Tag`,
                          () => {
                            this.editModifiers[messageId].noSuffix = true;
                            this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                          },
                          this.obfuscatedClass('change-edit-tag')
                        );
                        addElement(
                          `Undo Show As Message`,
                          () => {
                            delete this.editModifiers[messageId];
                            this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                          },
                          this.obfuscatedClass('undo-show-as-message')
                        );
                      } else if (typeof editNum !== 'undefined' && editNum !== null) {
                        addElement(
                          'Show Edit As Message',
                          () => {
                            this.editModifiers[messageId] = { editNum };
                            this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                          },
                          this.obfuscatedClass('show-as-message')
                        );
                        addElement(
                          'Delete Edit',
                          () => {
                            this.deleteEditedMessageFromRecord(messageId, parseInt(editNum));
                            this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                          },
                          this.obfuscatedClass('delete-edit'),
                          { color: 'danger' }
                        );
                      }
                    }
                  }
                }
              }
              if (record) {
                addElement(
                  'Remove From Log',
                  () => {
                    this.deleteMessageFromRecords(messageId);
                    this.saveData();
                    if (record.delete_data) {
                      this.dispatcher.dispatch({
                        type: 'MESSAGE_DELETE',
                        id: messageId,
                        channelId: channelId,
                        ML: true // ignore ourselves lol, it's already deleted
                        // on a side note, probably does nothing if we don't ignore
                      });
                    } else {
                      this.dispatcher.dispatch({ type: 'ML_FORCE_UPDATE_MESSAGE_CONTENT', id: messageId });
                    }
                  },
                  this.obfuscatedClass('remove-from-log'),
                  { color: 'danger' }
                );
              }
            }
            if (!newItems.length) return;
            menu.push(XenoLib.createContextMenuGroup([XenoLib.createContextMenuSubMenu(this.settings.contextmenuSubmenuName, newItems, this.obfuscatedClass('mlv2'))]));
          }
        )
      );
      return true;
    }
    this.unpatches.push(XenoLib.listenLazyContextMenu('MessageContextMenu', messageContextPatch));

    const handleWhiteBlackList_ = (newItems, id) => {
      const addElement = (label, callback, id, options = {}) => newItems.push(XenoLib.createContextMenuItem(label, callback, id, options));
      const whitelistIdx = this.settings.whitelist.findIndex(m => m === id);
      const blacklistIdx = this.settings.blacklist.findIndex(m => m === id);
      if (whitelistIdx == -1 && blacklistIdx == -1) {
        addElement(
          `Add to Whitelist`,
          () => {
            this.settings.whitelist.push(id);
            this.saveSettings();
            this.showToast('Added!', { type: 'success' });
          },
          this.obfuscatedClass('add-whitelist')
        );
        addElement(
          `Add to Blacklist`,
          () => {
            this.settings.blacklist.push(id);
            this.saveSettings();
            this.showToast('Added!', { type: 'success' });
          },
          this.obfuscatedClass('add-blacklist')
        );
      } else if (whitelistIdx != -1) {
        addElement(
          `Remove From Whitelist`,
          () => {
            this.settings.whitelist.splice(whitelistIdx, 1);
            this.saveSettings();
            this.showToast('Removed!', { type: 'success' });
          },
          this.obfuscatedClass('remove-whitelist')
        );
        addElement(
          `Move to Blacklist`,
          () => {
            this.settings.whitelist.splice(whitelistIdx, 1);
            this.settings.blacklist.push(id);
            this.saveSettings();
            this.showToast('Moved!', { type: 'success' });
          },
          this.obfuscatedClass('move-blacklist')
        );
      } else {
        addElement(
          `Remove From Blacklist`,
          () => {
            this.settings.blacklist.splice(blacklistIdx, 1);
            this.saveSettings();
            this.showToast('Removed!', { type: 'success' });
          },
          this.obfuscatedClass('remove-blacklist')
        );
        addElement(
          `Move to Whitelist`,
          () => {
            this.settings.blacklist.splice(blacklistIdx, 1);
            this.settings.whitelist.push(id);
            this.saveSettings();
            this.showToast('Moved!', { type: 'success' });
          },
          this.obfuscatedClass('move-whitelist')
        );
      }
      const notifIdx = this.settings.notificationBlacklist.indexOf(id);
      addElement(
        `${notifIdx === -1 ? 'Add To' : 'Remove From'} Notification Blacklist`,
        () => {
          if (notifIdx === -1) this.settings.notificationBlacklist.push(id);
          else this.settings.notificationBlacklist.splice(notifIdx, 1);
          this.saveSettings();
          this.showToast(notifIdx === -1 ? 'Added!' : 'Removed!', { type: 'success' });
        },
        this.obfuscatedClass('change-notif-blacklist')
      );
    };

    const messageLogIdentifier = this.randomString();
    const channelListTextChannelContextMenuPatch = (fmod) => {
      const mods = WebpackModules.findAll(e => (e.default === fmod || (e.default && e.default.__originalFunction === fmod)) && (e[messageLogIdentifier] === undefined && (e[messageLogIdentifier] = true)));
      if (!mods) return;
      const _this = this;
      function ChannelListTextChannelContextMenu(props) {
        const ret = props[ML_TYPE_L3](props);
        try {
          if (props.channel && props.channel.type === 4) return ret; // no lol, categories are unsupported
          const newItems = [];
          const menu = ZeresPluginLibrary.Utilities.getNestedProp(
            ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.type && e.type.displayName === 'Menu'),
            'props.children'
          );
          if (!Array.isArray(menu)) return ret;
          const addElement = (label, callback, id, options = {}) => newItems.push(XenoLib.createContextMenuItem(label, callback, id, options));
          addElement('𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌', () => _this.openWindow(), _this.obfuscatedClass('open'));
          handleWhiteBlackList(newItems, props.channel.id);
          if (!newItems.length) return ret;
          menu.push(XenoLib.createContextMenuGroup([XenoLib.createContextMenuSubMenu(_this.settings.contextmenuSubmenuName, newItems, _this.obfuscatedClass('mlv2'))]));
        } catch (err) {
          console.error('[messageloggerfix] Failed to patch Channel Context Menu', err);
        }
        return ret;
      }
      function NormalMenu(props) {
        const ret = props[ML_TYPE_L2](props);
        try {
          if (ret.type.displayName !== 'NormalMenu') return ret;
          if (!ChannelListTextChannelContextMenu.displayName) Object.assign(ChannelListTextChannelContextMenu, ret.type);
          ret.props[ML_TYPE_L3] = ret.type;
          ChannelListTextChannelContextMenu.__originalFunction = ret.type;
          ret.type = ChannelListTextChannelContextMenu;
        } catch (err) {
          console.error('[messageloggerfix] Failed to patch Normal Menu', err);
        }
        return ret;
      }
      function ChannelListTextChannelContextMenuWrapper(props) {
        const ret = props[ML_TYPE_L1](props);
        try {
          if (!NormalMenu.displayName) Object.assign(NormalMenu, ret.props.children.type);
          ret.props.children.props[ML_TYPE_L2] = ret.props.children.type;
          NormalMenu.__originalFunction = ret.props.children.type;
          ret.props.children.type = NormalMenu;
        } catch (err) {
          console.error('[messageloggerfix] Failed to patch ChannelListTextChannelContextMenuWrapper', err);
        }
        return ret;
      }
      mods.forEach(mod => {
        this.unpatches.push(
          this.Patcher.after(
            mod,
            'default',
            (_, __, ret) => {
              const damnedmenu = ret.props.children;
              if (damnedmenu.props[ML_TYPE_L1]) return;
              if (!ChannelListTextChannelContextMenuWrapper.displayName) Object.assign(ChannelListTextChannelContextMenuWrapper, damnedmenu.type);
              damnedmenu.props[ML_TYPE_L1] = damnedmenu.type;
              ChannelListTextChannelContextMenuWrapper.__originalFunction = damnedmenu.type;
              damnedmenu.type = ChannelListTextChannelContextMenuWrapper;
            }
          )
        )
      });
      return true;
    }
    this.unpatches.push(XenoLib.listenLazyContextMenu('ChannelListTextChannelContextMenu', channelListTextChannelContextMenuPatch, true));

    const guildContextMenu = () => {
      const mod = WebpackModules.find(e => e.default && (e.__powercordOriginal_default || e.default).displayName === 'GuildContextMenuWrapper');
      if (!mod) return console.error('[messageloggerfix] GuildContextMenu not found');

      const _this = this;
      function GuildContextMenu(props) {
        try {
          const ret = props[ML_TYPE_L1](props);

          const newItems = [];
          const menu = ZeresPluginLibrary.Utilities.getNestedProp(
            ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.type && e.type.displayName === 'Menu'),
            'props.children'
          );
          if (!Array.isArray(menu)) return;
          const addElement = (label, callback, id, options = {}) => newItems.push(XenoLib.createContextMenuItem(label, callback, id, options));
          addElement(
            '𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌',
            () => {
              _this.openWindow();
            },
            _this.obfuscatedClass('open')
          );
          handleWhiteBlackList(newItems, props.guild.id);
          if (!newItems.length) return;
          menu.push(XenoLib.createContextMenuGroup([XenoLib.createContextMenuSubMenu(_this.settings.contextmenuSubmenuName, newItems, _this.obfuscatedClass('mlv2'))]));
          return ret;
        } catch (err) {
          ZeresPluginLibrary.Logger.warn(_this.getName(), 'Failed to run patch GuildContextMenu', err);
          try {
            const ret = props[ML_TYPE_L1](props);
            return ret;
          } catch (err) {
            ZeresPluginLibrary.Logger.error(_this.getName(), 'Failed to original only GuildContextMenu', err);
            return null;
          }
        }
      }
      GuildContextMenu.displayName = 'GuildContextMenu';
      this.unpatches.push(
        this.Patcher.after(
          mod,
          'default',
          (_, __, { props: { children } }) => {
            if (children.props[ML_TYPE_L1]) return;
            if (!GuildContextMenu.displayName) Object.assign(GuildContextMenu, children.type);
            children.props[ML_TYPE_L1] = children.type;
            GuildContextMenu.__originalFunction = children.type;
            children.type = GuildContextMenu;
          }
        )
      );
      return true;
    }
    this.unpatches.push(XenoLib.listenLazyContextMenu('GuildContextMenuWrapper', guildContextMenu));

    const guildChannelUserContextMenuPatch = (fmod) => {
      const mod = WebpackModules.find(e => (e.default === fmod || (e.default && e.default.__originalFunction === fmod)));
      if (!mod) return console.error('[messageloggerfix] GuildChannelUserContextMenu not found');
      const _this = this;
      function GuildChannelUserContextMenu(props) {
        const ret = props[ML_TYPE_L2](props);
        try {
          const newItems = [];
          const menu = ZeresPluginLibrary.Utilities.getNestedProp(
            ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.type && e.type.displayName === 'Menu'),
            'props.children'
          );
          if (!Array.isArray(menu)) return ret;
          const addElement = (label, callback, id, options = {}) => newItems.push(XenoLib.createContextMenuItem(label, callback, id, options));
          addElement(
            '𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌',
            () => {
              _this.openWindow();
            },
            _this.obfuscatedClass('open')
          );
          if (!newItems.length) return ret;
          menu.push(XenoLib.createContextMenuGroup([XenoLib.createContextMenuSubMenu(_this.settings.contextmenuSubmenuName, newItems, _this.obfuscatedClass('mlv2'))]));
        } catch (err) {
          console.error(err);
        }
        return ret;
      }
      function GuildChannelUserContextMenuWrapper(props) {
        const ret = props[ML_TYPE_L1](props);
        try {
          if (ret.props.children.props[ML_TYPE_L2]) return ret;
          if (!GuildChannelUserContextMenu.displayName) Object.assign(GuildChannelUserContextMenu, ret.props.children.type);
          ret.props.children.props[ML_TYPE_L2] = ret.props.children.type;
          GuildChannelUserContextMenu.__originalFunction = ret.props.children.type;
          ret.props.children.type = GuildChannelUserContextMenu;
        } catch (err) {
          console.error('[messageloggerfix] Failed to patch GuildChannelUserContextMenuWrapper', err);
        }
        return ret;
      }
      this.unpatches.push(
        this.Patcher.after(
          mod,
          'default',
          (_, __, ret) => {
            const damnedmenu = ret.props.children;
            if (damnedmenu.props[ML_TYPE_L1]) return;
            if (!GuildChannelUserContextMenuWrapper.displayName) Object.assign(GuildChannelUserContextMenuWrapper, damnedmenu.type);
            damnedmenu.props[ML_TYPE_L1] = damnedmenu.type;
            GuildChannelUserContextMenuWrapper.__originalFunction = damnedmenu.type;
            damnedmenu.type = GuildChannelUserContextMenuWrapper;
          }
        )
      );
      return true;
    }
    this.unpatches.push(XenoLib.listenLazyContextMenu('GuildChannelUserContextMenu', guildChannelUserContextMenuPatch));

    const dmUserContextMenuPatch = (fmod) => {
      const mod = WebpackModules.find(e => (e.default === fmod || (e.default && e.default.__originalFunction === fmod)));
      if (!mod) return console.error('[messageloggerfix] DMUserContextMenu not found');
      const _this = this;
      function DMUserContextMenu(props) {
        const ret = props[ML_TYPE_L2](props);
        try {
          const newItems = [];
          const menu = ZeresPluginLibrary.Utilities.getNestedProp(
            ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.type && e.type.displayName === 'Menu'),
            'props.children'
          );
          if (!Array.isArray(menu)) return ret;
          const addElement = (label, callback, id, options = {}) => newItems.push(XenoLib.createContextMenuItem(label, callback, id, options));
          addElement(
            '𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌',
            () => {
              _this.openWindow();
            },
            _this.obfuscatedClass('open')
          );
          handleWhiteBlackList(newItems, props.channel.id);
          if (!newItems.length) return;
          menu.push(XenoLib.createContextMenuGroup([XenoLib.createContextMenuSubMenu(_this.settings.contextmenuSubmenuName, newItems, _this.obfuscatedClass('mlv2'))]));
        } catch (err) {
          console.error('[messageloggerfix] Error in DMUserContextMenu patch', err);
        }
        return ret;
      }
      function DMUserContextMenuWrapper(props) {
        const ret = props[ML_TYPE_L1](props);
        try {
          if (!DMUserContextMenu.displayName) Object.assign(DMUserContextMenu, ret.props.children.type);
          ret.props.children.props[ML_TYPE_L2] = ret.props.children.type;
          DMUserContextMenu.__originalFunction = ret.props.children.type;
          ret.props.children.type = DMUserContextMenu;
        } catch (err) {
          console.error('[messageloggerfix] Failed to patch DMUserContextMenuWrapper', err);
        }
        return ret;
      }
      this.unpatches.push(
        this.Patcher.after(
          mod,
          'default',
          (_, __, ret) => {
            const damnedmenu = ret.props.children;
            if (damnedmenu.props[ML_TYPE_L1]) return;
            if (!DMUserContextMenuWrapper.displayName) Object.assign(DMUserContextMenuWrapper, damnedmenu.type);
            damnedmenu.props[ML_TYPE_L1] = damnedmenu.type;
            DMUserContextMenuWrapper.__originalFunction = damnedmenu.type;
            damnedmenu.type = DMUserContextMenuWrapper;
          }
        )
      );
      return true;
    }
    this.unpatches.push(XenoLib.listenLazyContextMenu('DMUserContextMenu', dmUserContextMenuPatch));

    const groupDMUserContextMenuPatch = (fmod) => {
      const mod = WebpackModules.find(e => (e.default === fmod || (e.default && e.default.__originalFunction === fmod)));
      if (!mod) return console.error('[messageloggerfix] GroupDMUserContextMenu not found');
      const _this = this;
      function GroupDMUserContextMenu(props) {
        const ret = props[ML_TYPE_L2](props);
        try {
          const newItems = [];
          const menu = ZeresPluginLibrary.Utilities.getNestedProp(
            ZeresPluginLibrary.Utilities.findInReactTree(ret, e => e && e.type && e.type.displayName === 'Menu'),
            'props.children'
          );
          if (!Array.isArray(menu)) return ret;
          const addElement = (label, callback, id, options = {}) => newItems.push(XenoLib.createContextMenuItem(label, callback, id, options));
          addElement('𝐨𝗉𝐞𝗇 𝗅𝐨𝗀𝗌', () => _this.openWindow(), _this.obfuscatedClass('open'));
          handleWhiteBlackList(newItems, props.channel.id);
          if (!newItems.length) return ret;
          menu.push(XenoLib.createContextMenuGroup([XenoLib.createContextMenuSubMenu(_this.settings.contextmenuSubmenuName, newItems, _this.obfuscatedClass('mlv2'))]));
        } catch (err) {
          console.error('[messageloggerfix] Error in GroupDMUserContextMenu patch', err);
        }
        return ret;
      }
      function GroupDMUserContextMenuWrapper(props) {
        const ret = props[ML_TYPE_L1](props);
        try {
          if (!GroupDMUserContextMenu.displayName) Object.assign(GroupDMUserContextMenu, ret.props.children.type);
          ret.props.children.props[ML_TYPE_L2] = ret.props.children.type;
          GroupDMUserContextMenu.__originalFunction = ret.props.children.type;
          ret.props.children.type = GroupDMUserContextMenu;
        } catch (err) {
          console.error('[messageloggerfix] Failed to patch GroupDMUserContextMenuWrapper', err);
        }
        return ret;
      }
      this.unpatches.push(
        this.Patcher.after(
          mod,
          'default',
          (_, __, ret) => {
            const damnedmenu = ret.props.children;
            if (damnedmenu.props[ML_TYPE_L1]) return;
            if (!GroupDMUserContextMenuWrapper.displayName) Object.assign(GroupDMUserContextMenuWrapper, damnedmenu.type);
            damnedmenu.props[ML_TYPE_L1] = damnedmenu.type;
            GroupDMUserContextMenuWrapper.__originalFunction = damnedmenu.type;
            damnedmenu.type = GroupDMUserContextMenuWrapper;
          }
        )
      );
      return true;
    };
    this.unpatches.push(XenoLib.listenLazyContextMenu('GroupDMUserContextMenu', groupDMUserContextMenuPatch));

  }
  /* ==================================================-|| END CONTEXT MENU ||-================================================== */
};
