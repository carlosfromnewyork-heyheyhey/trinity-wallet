import assign from 'lodash/assign';
import each from 'lodash/each';
import includes from 'lodash/includes';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import values from 'lodash/values';
import size from 'lodash/size';
import Realm from 'realm';
import {
    TransactionSchema,
    AddressSchema,
    AccountSchema,
    AddressSpendStatusSchema,
    WalletSchema,
    NodeSchema,
    NotificationsSettingsSchema,
    WalletSettingsSchema,
    ErrorLogSchema,
} from '../schema';

const SCHEMA_VERSION = 0;
const STORAGE_PATH = `trinity-${SCHEMA_VERSION}.realm`;

/**
 * Model for Account.
 */
class Account {
    static schema = AccountSchema;

    /**
     * Gets object for provided id (account name)
     *
     * @method getObjectForId
     * @param {string} id
     *
     * @returns {object}
     */
    static getObjectForId(id) {
        return realm.objectForPrimaryKey('Account', id);
    }

    /**
     * Gets objects for all stored accounts.
     *
     * @returns {Realm.Results<any>}
     */
    static get data() {
        return realm.objects('Account');
    }

    /**
     * Gets account data for all stored accounts.
     * @method getDataAsArray
     *
     * @returns {array}
     */
    static getDataAsArray() {
        const accounts = Account.data;

        return map(accounts, (account) =>
            assign({}, account, {
                addressData: values(account.addressData),
                transactions: values(account.transactions),
            }),
        );
    }

    /**
     * Creates account.
     * @method create
     *
     * @param {object} data
     */
    static create(data) {
        realm.write(() => realm.create('Account', data));
    }

    /**
     * Updates account.
     * @method updateTransactionsAndAddressData
     *
     * @param {string} name
     * @param {object} data
     */
    static update(name, data) {
        realm.write(() => realm.create('Account', { name, ...data }, true));
    }

    /**
     * Deletes account.
     * @method delete
     *
     * @param {string} name
     */
    static delete(name) {
        realm.write(() => realm.delete(Account.getObjectForId(name)));
    }

    /**
     * Migrate account data under a new name.
     *
     * @method migrate
     *
     * @param {string} from - Account name
     * @param {string} to - New account name
     */
    static migrate(from, to) {
        const accountData = Account.getObjectForId(from);

        realm.write(() => {
            // Create account with new name.
            realm.create('Account', assign({}, accountData, { accountName: to }));
            // Delete account with old name.
            realm.delete(accountData);
        });
    }
}

/**
 * Model for Address.
 */
class Address {
    static schema = AddressSchema;
}

/**
 * Model for Address spent status.
 */
class AddressSpendStatus {
    static schema = AddressSpendStatusSchema;
}

/**
 * Model for node.
 */
class Node {
    static schema = NodeSchema;

    /**
     * Gets object for provided id (url)
     *
     * @method getObjectForId
     * @param {string} id
     *
     * @returns {object}
     */
    static getObjectForId(id) {
        return realm.objectForPrimaryKey('Node', id);
    }

    /**
     * Returns a list of nodes
     *
     * @return {Realm.Results}
     */
    static get data() {
        return realm.objects('Node');
    }

    /**
     * Returns nodes as array
     *
     * @method getDataAsArray
     *
     * @return {array}
     */
    static getDataAsArray() {
        return map(Node.data, (node) => assign({}, node));
    }

    /**
     * Adds a custom node
     * @param {string} url Node URL
     */
    static addCustomNode(url, pow) {
        realm.write(() => {
            realm.create('Node', {
                url,
                custom: true,
                pow,
            });
        });
    }

    /**
     * Removes a node.
     *
     * @method delete
     * @param {string} url
     */
    static delete(url) {
        const node = Node.getObjectForId(url);

        realm.write(() => realm.delete(node));
    }

    /**
     *
     * @
     * @param {array} nodes
     */
    static addNodes(nodes) {
        if (size(nodes)) {
            const existingUrls = map(Node.getDataAsArray(), (node) => node.url);

            realm.write(() => {
                each(nodes, (node) => {
                    // If it's an existing node, just update properties.
                    if (includes(existingUrls, node.url)) {
                        realm.create('Node', node, true);
                    } else {
                        realm.create('Node', node);
                    }
                });
            });
        }
    }
}

/**
 * Model for notification settings.
 */
class NotificationsSettings {
    static schema = NotificationsSettingsSchema;
}

/**
 * Model for transaction.
 */
class Transaction {
    static schema = TransactionSchema;
}

/**
 * Model for wallet data and settings.
 */
class Wallet {
    static schema = WalletSchema;
    static version = Number(SCHEMA_VERSION);

    /**
     * Gets object for provided id (version)
     *
     * @method getObjectForId
     * @param {number} id
     *
     * @returns {object}
     */
    static getObjectForId(id = Wallet.version) {
        return realm.objectForPrimaryKey('Wallet', id);
    }

    /**
     * Gets wallet data.
     *
     * @return {Realm.Results}
     */
    static get data() {
        return realm.objects('Wallet');
    }

    /**
     * Wallet settings for most recent version.
     */
    static get latestSettings() {
        const dataForCurrentVersion = Wallet.getObjectForId();

        return dataForCurrentVersion.settings;
    }

    /**
     * Wallet data for most recent version.
     */
    static get latestData() {
        return Wallet.getObjectForId();
    }

    /**
     * Sets onboarding complete for wallet.
     * @method setOnboardingComplete
     */
    static setOnboardingComplete() {
        realm.write(() => {
            Wallet.latestData.onboardingComplete = true;
        });
    }

    /**
     * Updates remote proof of work setting.
     *
     * @method updateRemotePoWSetting
     * @param {boolean} payload
     */
    static updateRemotePowSetting(payload) {
        realm.write(() => {
            Wallet.latestSettings.remotePoW = payload;
        });
    }

    /**
     * Updates auto-promotion setting.
     *
     * @method updateAutoPromotionSetting
     * @param {boolean} payload
     */
    static updateAutoPromotionSetting(payload) {
        realm.write(() => {
            Wallet.latestSettings.autoPromotion = payload;
        });
    }

    /**
     * Updates auto node switching configuration.
     *
     * @method updateAutoNodeSwitchingSetting
     * @param {boolean} payload
     */
    static updateAutoNodeSwitchingSetting(payload) {
        realm.write(() => {
            Wallet.latestSettings.autoNodeSwitching = payload;
        });
    }

    /**
     * Updates lock screen timeout.
     *
     * @method updateLockScreenTimeout
     * @param {number} payload
     */
    static updateLockScreenTimeout(payload) {
        realm.write(() => {
            Wallet.latestSettings.lockScreenTimeout = payload;
        });
    }

    /**
     * Updates active locale.
     *
     * @method updateLocale
     * @param {string} payload
     */
    static updateLocale(payload) {
        realm.write(() => {
            Wallet.latestSettings.locale = payload;
        });
    }

    /**
     * Updates wallet's mode.
     *
     * @method updateMode
     * @param {string} payload
     */
    static updateMode(payload) {
        realm.write(() => {
            Wallet.latestSettings.mode = payload;
        });
    }

    /**
     * Updates wallet's node.
     *
     * @method updateNode
     * @param {string} payload
     */
    static updateNode(payload) {
        realm.write(() => {
            Wallet.latestSettings.node = payload;
        });
    }

    /**
     * Updates wallet's language.
     *
     * @method updateLanguage
     * @param {string} payload
     */
    static updateLanguage(payload) {
        realm.write(() => {
            Wallet.latestSettings.language = payload;
        });
    }

    /**
     * Updates currency related data (conversionRate, currency, availableCurrencies)
     *
     * @method updateCurrencyData
     * @param {object} payload
     */
    static updateCurrencyData(payload) {
        const { conversionRate, currency, availableCurrencies } = payload;

        realm.write(() => {
            Wallet.latestSettings.currency = currency;
            Wallet.latestSettings.conversionRate = conversionRate;
            Wallet.latestSettings.availableCurrencies = availableCurrencies;
        });
    }

    /**
     * Updates wallet's theme.
     *
     * @method updateTheme
     * @param {string} payload
     */
    static updateTheme(payload) {
        realm.write(() => {
            Wallet.latestSettings.themeName = payload;
        });
    }

    /**
     * Sets a randomly selected node.
     *
     * @method setRandomlySelectedNode
     * @param {string} payload
     */
    static setRandomlySelectedNode(payload) {
        realm.write(() => {
            Wallet.latestSettings.node = payload;
            Wallet.latestSettings.hasRandomizedNode = true;
        });
    }

    /**
     * Updates two factor authentication configuration.
     *
     * @method update2FASetting
     * @param {boolean} payload
     */
    static update2FASetting(payload) {
        realm.write(() => {
            Wallet.latestSettings.is2FAEnabled = payload;
        });
    }

    /**
     * Updates finger print authentication configuration.
     *
     * @method updateFingerPrintAuthenticationSetting
     * @param {boolean} payload
     */
    static updateFingerPrintAuthenticationSetting(payload) {
        realm.write(() => {
            Wallet.latestSettings.isFingerprintEnabled = payload;
        });
    }

    /**
     * Sets app versions.
     *
     * @method setAppVersions
     * @param {object} payload
     */
    static setVersions(payload) {
        const { buildNumber, version } = payload;

        realm.write(() => {
            Wallet.latestSettings.buildNumber = buildNumber;
            Wallet.latestSettings.version = version;
        });
    }

    /**
     * Sets acceptedTerms to true when user has accepted terms and conditions.
     *
     * @method acceptTerms
     * @param {object} payload
     */
    static acceptTerms() {
        realm.write(() => {
            Wallet.latestSettings.acceptedTerms = true;
        });
    }

    /**
     * Sets acceptedPrivacy to true when user has accepted privacy policy.
     *
     * @method acceptPrivacyPolicy
     * @param {object} payload
     */
    static acceptPrivacyPolicy() {
        realm.write(() => {
            Wallet.latestSettings.acceptedPrivacy = true;
        });
    }

    /**
     * Updates configuration for showing/hiding empty transactions.
     *
     * @method toggleEmptyTransactionsDisplay
     */
    static toggleEmptyTransactionsDisplay() {
        realm.write(() => {
            const settings = Wallet.latestSettings;

            settings.hideEmptyTransactions = !settings.hideEmptyTransactions;
        });
    }

    /**
     * Sets to true on forced password update.
     *
     * @method completeForcedPasswordUpdate
     */
    static completeForcedPasswordUpdate() {
        realm.write(() => {
            Wallet.latestSettings.completedForcedPasswordUpdate = true;
        });
    }

    /**
     * Updates byte-trit sweep setting.
     *
     * @method updateByteTritSweepSetting
     * @param {boolean} payload
     */
    static updateByteTritSweepSetting(payload) {
        realm.write(() => {
            Wallet.latestSettings.completedByteTritSweep = payload;
        });
    }

    /**
     * Updates tray app configuration (desktop wallet)
     *
     * @method updateTraySetting
     * @param {boolean} payload
     */
    static updateTraySetting(payload) {
        realm.write(() => {
            Wallet.latestSettings.isTrayEnabled = payload;
        });
    }

    /**
     * Updates notifications configuration.
     *
     * @method updateNotificationsSetting
     * @param {object} payload
     */
    static updateNotificationsSetting(payload) {
        const { type, enabled } = payload;

        realm.write(() => {
            Wallet.latestSettings.notifications[type] = enabled;
        });
    }

    /**
     * Updates error log.
     *
     * @method updateErrorLog
     * @param {string} payload
     */
    static updateErrorLog(payload) {
        realm.write(() => {
            Wallet.latestData.errorLog.push(payload);
        });
    }

    /**
     * Clears error log.
     *
     * @method clearErrorLog
     */
    static clearErrorLog() {
        realm.write(() => {
            Wallet.latestData.errorLog = [];
        });
    }

    /**
     * Creates a wallet object if it does not already exist.
     * @method createIfNotExists
     */
    static createIfNotExists() {
        const shouldCreate = isEmpty(Wallet.getObjectForId());

        if (shouldCreate) {
            realm.write(() =>
                realm.create('Wallet', {
                    version: Wallet.version,
                    settings: { notifications: {} },
                }),
            );
        }
    }
}

/**
 * Model for wallet settings.
 */
class WalletSettings {
    static schema = WalletSettingsSchema;
}

/**
 * Model for error logs.
 */
class ErrorLog {
    static schema = ErrorLogSchema;
}

/**
 * Realm storage default configuration.
 */
export const config = {
    path: STORAGE_PATH,
    schema: [
        Account,
        Address,
        AddressSpendStatus,
        ErrorLog,
        Node,
        NotificationsSettings,
        Transaction,
        WalletSettings,
        Wallet,
    ],
    schemaVersion: SCHEMA_VERSION,
};

// Initialise realm instance
const realm = new Realm(config);

/**
 * Deletes all objects in storage and deletes storage file for provided config
 *
 * @method purge
 *
 * @returns {Promise<any>}
 */
const purge = () =>
    new Promise((resolve, reject) => {
        try {
            realm.write(() => realm.deleteAll());
            resolve();
        } catch (error) {
            reject(error);
        }
    });

/**
 * Initialises storage.
 *
 * @method initialise
 * @returns {Promise}
 */
const initialise = () =>
    new Promise((resolve, reject) => {
        try {
            Wallet.createIfNotExists();
            resolve();
        } catch (error) {
            reject(error);
        }
    });

/**
 * Purges persisted data and reinitialises storage.
 *
 * @method reinitialise
 */
const reinitialise = () => purge().then(() => initialise());

export {
    realm,
    initialise,
    reinitialise,
    purge,
    Account,
    ErrorLog,
    Transaction,
    Address,
    AddressSpendStatus,
    Node,
    Wallet,
};
