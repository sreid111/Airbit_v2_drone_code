function JoystickDeadBand () {
    if (Math.abs(roll) < 5) {
        roll = 0
    }
    if (Math.abs(pitch) < 5) {
        pitch = 0
    }
}
function screen () {
    if (pins.analogReadPin(AnalogPin.P0) > 770) {
        if (pins.analogReadPin(AnalogPin.P0) > 950) {
            basic.showIcon(IconNames.Yes)
            basic.showString("Charging finished!")
        } else {
            basic.showLeds(`
                . . # . .
                . # # # .
                . # . # .
                . # . # .
                . # # # .
                `)
            basic.showLeds(`
                . . # . .
                . # # # .
                . # . # .
                . # # # .
                . # # # .
                `)
            basic.showLeds(`
                . . # . .
                . # # # .
                . # # # .
                . # # # .
                . # # # .
                `)
        }
    } else {
        if (mode == 0) {
            dots()
        }
        if (mode == 1) {
            led.plotBarGraph(
            airbit.batteryLevel(),
            100
            )
        }
        if (mode == 2) {
            basic.showNumber(airbit.batterymVolt())
        }
        if (mode == 3) {
            basic.clearScreen()
            motorLed()
        }
        if (mode == 4) {
            basic.showNumber(pins.analogReadPin(AnalogPin.P0))
        }
        if (mode == 5) {
            basic.showNumber(throttle)
        }
    }
}
function mainLoop () {
    while (true) {
        let imuRoll = 0
        airbit.IMU_sensorRead()
        airbit.calculateAngles()
        basic.pause(1)
        airbit.stabilisePid()
        if (arm == 0) {
            stable = 1
        }
        if (Math.abs(imuRoll) > 60) {
            stable = 0
        }
        if (arm && stable) {
            if (throttle == 0) {
                airbit.MotorSpeed(
                5,
                5,
                5,
                5
                )
            } else {
                airbit.MotorSpeed(
                motorA,
                motorB,
                motorC,
                motorD
                )
            }
        } else {
            airbit.cleanReg()
            airbit.MotorSpeed(
            0,
            0,
            0,
            0
            )
        }
        cpuTime = input.runningTime() - startTime
        startTime = input.runningTime()
    }
}
input.onButtonPressed(Button.A, function () {
    mode += -1
    if (mode < 0) {
        mode = 5
    }
})
function radioSendData () {
    let radioReceivedTimer = 0
    radio.sendValue("p", rollPitchP)
    radio.sendValue("i", rollPitchI)
    radio.sendValue("d", rollPitchD)
    radio.sendValue("t", radioReceivedTimer)
    radio.sendValue("R2", roll)
    radio.sendValue("yp", yawP)
    radio.sendValue("yd", yawD)
    radio.sendValue("v", batterymVoltSmooth)
    radio.sendValue("p0", pins.analogReadPin(AnalogPin.P0))
    basic.pause(500)
}
input.onButtonPressed(Button.AB, function () {
    mode = 0
})
input.onButtonPressed(Button.B, function () {
    mode += 1
    if (mode > 5) {
        mode = 0
    }
})
function motorLed () {
    led.plotBrightness(0, 4, motorA)
    led.plotBrightness(0, 0, motorB)
    led.plotBrightness(4, 4, motorC)
    led.plotBrightness(4, 0, motorD)
}
radio.onReceivedValue(function (name, value) {
    if (name == "P") {
        pitch = expo(value) / -2
        pitch = Math.constrain(pitch, -15, 15)
    }
    if (name == "A") {
        arm = value
    }
    if (name == "R") {
        roll = expo(value) / 2
        roll = Math.constrain(roll, -15, 15)
    }
    if (name == "T") {
        throttle = value
        throttle = Math.constrain(throttle, 0, 100)
        if (batterymVoltSmooth < 3400) {
            throttle = Math.constrain(throttle, 0, 75)
        }
    }
    if (name == "Y") {
        yaw += value * 0.1
    }
})
// smartBar(0, throttle)
// smartBar(4, airbit.batteryLevel())
function dots () {
    basic.clearScreen()
    led.plot(Math.map(roll, -15, 15, 0, 4), Math.map(pitch, -15, 15, 4, 0))
    led.plot(Math.map(yaw, -30, 30, 0, 4), 4)
    if (arm) {
        led.plot(0, 0)
    }
    airbit.smartBar(0, throttle)
    airbit.smartBar(4, airbit.batteryLevel())
}
function expo (inp: number) {
    if (inp >= 0) {
        return inp / expoSetting + inp * inp / expoFactor
    } else {
        return inp / expoSetting - inp * inp / expoFactor
    }
}
let yaw = 0
let startTime = 0
let cpuTime = 0
let stable = 0
let arm = 0
let throttle = 0
let mode = 0
let pitch = 0
let roll = 0
let expoFactor = 0
let expoSetting = 0
let motorD = 0
let motorB = 0
let motorC = 0
let motorA = 0
let yawD = 0
let yawP = 0
let rollPitchD = 0
let rollPitchI = 0
let rollPitchP = 0
let batterymVoltSmooth = 0
let imu_present = 0
let baro_present = 0
let pca_present = 0
let imuYaw = 0
let imuPitch = 0
let batteryVolt = 0
batterymVoltSmooth = 3700
// Default: 0.7
rollPitchP = 0.9
rollPitchI = 0.004
// Default: 15
rollPitchD = 15
// Default: 4
yawP = 5
// Default: 10
yawD = 70
motorA = 0
motorC = 0
motorB = 0
motorD = 0
let radioGroup = 11
expoSetting = 2
expoFactor = 45 * 45 / (45 - 45 / expoSetting)
radio.setGroup(radioGroup)
i2crr.setI2CPins(DigitalPin.P2, DigitalPin.P1)
basic.pause(100)
airbit.IMU_Start()
basic.pause(100)
airbit.PCA_Start()
basic.pause(100)
airbit.baroStart()
basic.pause(100)
airbit.IMU_gyro_calibrate()
basic.forever(function () {
    if (batterymVoltSmooth > 3450) {
        screen()
    } else if (batterymVoltSmooth > 3400) {
        basic.showLeds(`
            . . # . .
            . # . # .
            . # . # .
            . # . # .
            . # # # .
            `)
    } else {
        basic.showLeds(`
            . . # . .
            . # . # .
            . # . # .
            . # . # .
            . # # # .
            `)
        basic.showLeds(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
    }
})
// basic.forever(function () {
// 
// airbit.batteryCalculation()
// 
// radio.sendValue("l", looptime)
// 
// radio.sendValue("p", rollPitchP)
// 
// radio.sendValue("i", rollPitchI)
// 
// radio.sendValue("a", tuningOutA)
// 
// radio.sendValue("b", tuningOutB)
// 
// })
basic.forever(function () {
    radioSendData()
})
basic.forever(function () {
    airbit.batteryCalculation()
})
basic.forever(function () {
    mainLoop()
})
