import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import { StyleSheet, View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { navigator } from 'libs/navigation';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DualFooterButtons from 'ui/components/DualFooterButtons';
import AnimatedComponent from 'ui/components/AnimatedComponent';
import Header from 'ui/components/Header';
import SeedVaultExportComponent from 'ui/components/SeedVaultExportComponent';
import { leaveNavigationBreadcrumb } from 'libs/bugsnag';
import { isAndroid } from 'libs/device';
import { height } from 'libs/dimensions';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topContainer: {
        flex: 1.4,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    midContainer: {
        flex: 2.6,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingBottom: height / 16,
    },
    bottomContainer: {
        flex: 0.5,
        justifyContent: 'flex-end',
    },
});

/** Seed Vault Backup component */
class SeedVaultBackup extends Component {
    static propTypes = {
        /** Component ID */
        componentId: PropTypes.string.isRequired,
        /** @ignore */
        t: PropTypes.func.isRequired,
        /** @ignore */
        theme: PropTypes.object.isRequired,
        /** @ignore */
        seed: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            step: 'isViewingGeneralInfo',
            seed: props.seed,
        };
    }

    componentDidMount() {
        leaveNavigationBreadcrumb('SeedVaultBackup');
    }

    /**
     * Determines course of action on right button press dependent on current progress step
     *
     * @method onRightButtonPress
     */
    onRightButtonPress() {
        const { step } = this.state;
        if (step === 'isExporting' && !isAndroid) {
            return this.SeedVaultExportComponent.onExportPress();
        } else if (step === 'isSelectingSaveMethodAndroid') {
            return this.goBack();
        }
        this.SeedVaultExportComponent.onNextPress();
    }

    /**
     * Navigates back to SeedBackupOptions
     *
     * @method goBack
     */
    goBack() {
        navigator.pop(this.props.componentId);
    }

    render() {
        const { t, theme: { body } } = this.props;
        const { step, seed } = this.state;

        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <View style={styles.topContainer}>
                        <AnimatedComponent
                            animationInType={['slideInRight', 'fadeIn']}
                            animationOutType={['slideOutLeft', 'fadeOut']}
                            delay={400}
                        >
                            <Header textColor={body.color}>{t('exportSeedVault')}</Header>
                        </AnimatedComponent>
                    </View>
                    <View style={styles.midContainer}>
                        <View style={{ flex: 0.2 }} />
                        <AnimatedComponent
                            animationInType={['slideInRight', 'fadeIn']}
                            animationOutType={['slideOutLeft', 'fadeOut']}
                            delay={200}
                        >
                            <SeedVaultExportComponent
                                step={step}
                                setProgressStep={(step) => this.setState({ step })}
                                goBack={() => this.goBack()}
                                onRef={(ref) => {
                                    this.SeedVaultExportComponent = ref;
                                }}
                                isAuthenticated
                                seed={seed}
                                setSeed={(seed) => this.setState({ seed })}
                            />
                        </AnimatedComponent>
                    </View>
                    <View style={styles.bottomContainer}>
                        <AnimatedComponent animationInType={['fadeIn']} animationOutType={['fadeOut']} delay={0}>
                            <DualFooterButtons
                                onLeftButtonPress={() => this.SeedVaultExportComponent.onBackPress()}
                                onRightButtonPress={() => this.onRightButtonPress()}
                                leftButtonText={t('global:back')}
                                rightButtonText={
                                    step === 'isExporting' && !isAndroid
                                        ? t('global:export')
                                        : step === 'isSelectingSaveMethodAndroid' ? t('global:done') : t('global:next')
                                }
                            />
                        </AnimatedComponent>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const mapStateToProps = (state) => ({
    seed: state.wallet.seed,
    theme: state.settings.theme,
});

export default withNamespaces(['seedVault', 'global'])(connect(mapStateToProps, null)(SeedVaultBackup));
