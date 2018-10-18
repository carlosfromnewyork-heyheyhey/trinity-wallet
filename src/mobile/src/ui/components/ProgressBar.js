import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PanResponder, Easing, Animated, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import sliderLoadingAnimation from 'shared-modules/animations/slider-loader.json';
import sliderSuccessAnimation from 'shared-modules/animations/slider-success.json';
import timer from 'react-native-timer';
import { height } from 'libs/dimensions';
import { Styling } from 'ui/theme/general';
import { Icon } from 'ui/theme/icons';

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        borderRadius: height / 10,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    text: {
        fontFamily: 'SourceSansPro-Regular',
        fontSize: Styling.fontSize3,
        position: 'absolute',
        backgroundColor: 'transparent',
    },
    slider: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

class ProgressBar extends Component {
    static propTypes = {
        /** Progress percentage number */
        progress: PropTypes.number.isRequired,
        /** Filled bar color */
        filledColor: PropTypes.string,
        /** Unfilled bar color */
        unfilledColor: PropTypes.string,
        /** Progress bar width */
        width: PropTypes.number,
        /** Progress bar height */
        height: PropTypes.number,
        /** Progress bar text color */
        textColor: PropTypes.string,
        /** Progress bar text */
        progressText: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
        /** Total number of progress steps */
        stepSize: PropTypes.number,
        preSwipeColor: PropTypes.string,
        postSwipeColor: PropTypes.string,
        staticText: PropTypes.string,
        onCompleteSwipe: PropTypes.func,
        interupt: PropTypes.bool,
    };

    static defaultProps = {
        animationType: 'timing',
        width: Styling.contentWidth,
        height: height / 11,
        indeterminate: false,
        color: 'rgba(247, 208, 2, 0.75)',
        textColor: 'rgba(247, 208, 2, 0.75)',
    };

    constructor(props) {
        super(props);
        this.state = {
            progressPosition: new Animated.Value(0),
            progress: -1,
            counter: 0,
            sliderPosition: new Animated.Value(0),
            thresholdDistance: props.width - props.height,
            sliderColor: props.preSwipeColor,
            textOpacity: new Animated.Value(1),
            sliderOpacity: new Animated.Value(1),
            progressText: '',
            inProgress: false,
            sliderAnimation: sliderLoadingAnimation,
        };
    }

    componentWillMount() {
        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderMove: (evt, gestureState) => {
                if (this.state.inProgress) {
                    return;
                }
                const moveValue = gestureState.dx;
                const relativeSlidePosition = moveValue / this.state.thresholdDistance;
                this.state.textOpacity.setValue(1 - relativeSlidePosition * 2);
                this.state.sliderOpacity.setValue(1 - relativeSlidePosition / 2.5);
                if (moveValue >= 0 && moveValue <= this.state.thresholdDistance) {
                    this.state.sliderPosition.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (this.state.inProgress) {
                    return;
                }
                const releaseValue = gestureState.dx;
                if (gestureState.dx > 0) {
                    if (releaseValue >= this.state.thresholdDistance) {
                        this.onCompleteSwipe();
                    } else if (releaseValue >= 0) {
                        this.onIncompleteSwipe();
                    }
                }
            },
            onPanResponderTerminate: () => {},
            onPanResponderTerminationRequest: () => true,
        });
    }

    componentWillReceiveProps(newProps) {
        if (this.props.progress !== newProps.progress) {
            // On first progress change
            if (this.props.progress < 0) {
                this.setState({ inProgress: true });
                this.animateProgressBar();
                this.sliderAnimation.play();
            }
            // On every progress change
            this.setState({ progress: newProps.progress, counter: newProps.progress });
            this.onProgressStepChange(newProps.progressText);
            // On last progress change
            if (this.props.stepSize > 0 && newProps.progress === 1 - this.props.stepSize) {
                this.onProgressComplete();
            }
        }
        if (this.props.interupt !== newProps.interupt) {
            this.onInterupt();
        }
    }

    componentWillUnmount() {
        timer.clearTimeout('delayProgressTextChange');
        timer.clearTimeout('delayProgressTextFadeOut');
        timer.clearTimeout('delaySliderReset');
        timer.clearTimeout('delaySuccessAnimation');
        timer.clearTimeout('delaySliderOpacityIncreaseAnimation');
    }

    onProgressComplete() {
        this.sliderAnimation.reset();
        this.setState({ sliderAnimation: sliderSuccessAnimation, shouldLoopSliderAnimation: false });
        timer.setTimeout(
            'delaySliderOpacityIncreaseAnimation',
            () => {
                Animated.timing(this.state.sliderOpacity, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.ease,
                }).start();
            },
            900,
        );
        timer.setTimeout(
            'delaySuccessAnimation',
            () => {
                this.sliderAnimation.play();
            },
            1200,
        );
        timer.setTimeout(
            'delaySliderReset',
            () => {
                this.sliderAnimation.reset();
                this.setState({
                    progress: -1,
                    inProgress: false,
                    sliderAnimation: sliderLoadingAnimation,
                    shouldLoopSliderAnimation: true,
                });
                this.state.progressPosition.setValue(0);
                this.resetSlider();
            },
            4000,
        );
    }

    onIncompleteSwipe() {
        const duration = 500;
        Animated.parallel([
            Animated.spring(this.state.sliderPosition, {
                toValue: 0,
                duration,
            }),
            Animated.timing(this.state.sliderOpacity, {
                toValue: 1,
                duration,
            }),
            Animated.timing(this.state.textOpacity, {
                toValue: 1,
                duration,
            }),
        ]).start();
    }

    onInterupt() {
        this.setState({ progress: -1, inProgress: false });
        Animated.timing(this.state.progressPosition).stop();
        this.state.progressPosition.setValue(0);
        Animated.timing(this.state.sliderPosition).stop();
        this.resetSlider();
    }

    onCompleteSwipe() {
        Animated.timing(this.state.sliderPosition, {
            toValue: this.props.width - this.props.height,
            duration: 50,
        }).start();
        this.setState({ sliderColor: this.props.postSwipeColor });
        this.props.onCompleteSwipe();
    }

    onProgressStepChange(progressText) {
        // On first step change
        if (this.state.progress < 0) {
            this.setState({ progressText });
            return Animated.timing(this.state.textOpacity, {
                toValue: 1,
                duration: 100,
            }).start();
        }
        // On last step change
        if (this.state.progress === 1) {
            return timer.setTimeout(
                'delayProgressTextFadeOut',
                () => {
                    Animated.timing(this.state.textOpacity, {
                        toValue: 0,
                        duration: 100,
                    }).start();
                },
                5000,
            );
        }
        // On any other step change
        if (this.state.progress >= 0) {
            return timer.setTimeout(
                'delayProgressTextChange',
                () => {
                    Animated.timing(this.state.textOpacity, {
                        toValue: 0,
                        duration: 100,
                    }).start(() => {
                        this.setState({ progressText });
                        Animated.timing(this.state.textOpacity, {
                            toValue: 1,
                            duration: 100,
                        }).start();
                    });
                },
                300,
            );
        }
    }

    animateProgressBar() {
        const nextStep = this.state.progress + this.props.stepSize;
        const increment = this.props.stepSize / 100;
        const updatedCounter = this.state.counter + increment;
        if (this.state.counter < nextStep - this.props.stepSize / 5) {
            this.setState({ counter: updatedCounter });
        }
        Animated.timing(this.state.progressPosition, {
            toValue: Math.max(this.state.progress, this.state.counter),
            useNativeDriver: true,
            easing: Easing.ease,
        }).start(() => {
            if (this.state.counter <= 1 && this.state.inProgress) {
                this.animateProgressBar();
            }
        });
    }

    resetSlider() {
        const duration = 500;
        this.setState({ sliderColor: this.props.preSwipeColor });
        Animated.parallel([
            Animated.spring(this.state.sliderPosition, {
                toValue: 0,
                duration,
                easing: Easing.elastic(),
            }),
            Animated.timing(this.state.sliderOpacity, {
                toValue: 1,
                duration,
                easing: Easing.ease,
            }),
            Animated.timing(this.state.textOpacity, {
                toValue: 1,
                duration,
                easing: Easing.ease,
            }),
        ]).start();
    }

    render() {
        const { height, width, textColor, staticText, unfilledColor, filledColor } = this.props;
        const progressStyle = {
            backgroundColor: filledColor,
            height,
            width,
            transform: [
                {
                    translateX: this.state.progressPosition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-width, 0],
                    }),
                },
            ],
        };
        return (
            <View style={[styles.container, { height, width, backgroundColor: unfilledColor }]}>
                <Animated.View style={progressStyle} />
                {(this.state.inProgress && (
                    <Animated.Text style={[styles.text, { color: textColor, opacity: this.state.textOpacity }]}>
                        {this.state.progressText}
                    </Animated.Text>
                )) || (
                    <Animated.Text style={[styles.text, { color: textColor, opacity: this.state.textOpacity }]}>
                        {staticText}
                    </Animated.Text>
                )}
                <Animated.View
                    {...this._panResponder.panHandlers}
                    style={[
                        {
                            width,
                            height,
                            position: 'absolute',
                            justifyContent: 'center',
                            opacity: this.state.sliderOpacity,
                        },
                        {
                            transform: [{ translateX: this.state.sliderPosition }],
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.slider,
                            { width: height, height, backgroundColor: 'transparent', borderRadius: height, padding: 5 },
                        ]}
                    >
                        <View
                            style={[
                                styles.slider,
                                {
                                    width: height - 8,
                                    height: height - 8,
                                    backgroundColor: this.state.sliderColor,
                                    borderRadius: height,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                },
                            ]}
                        >
                            <LottieView
                                ref={(animation) => {
                                    this.sliderAnimation = animation;
                                }}
                                source={this.state.sliderAnimation}
                                style={{ width: height * 0.8, height: height * 0.8, position: 'absolute' }}
                                loop={this.state.shouldLoopSliderAnimation}
                            />
                            {!this.state.inProgress && (
                                <Icon
                                    name="arrowRight"
                                    size={height / 2.5}
                                    color={unfilledColor}
                                    style={{ backgroundColor: 'transparent' }}
                                />
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>
        );
    }
}

export default ProgressBar;
