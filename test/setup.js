// @noflow

const path = require("path")
const {
  Builder,
  Capabilities,
  By,
  until,
  logging
} = require("selenium-webdriver")
const firefox = require("selenium-webdriver/firefox")
const geckodriver = require("geckodriver")
const { Command } = require("selenium-webdriver/lib/command")
const fs = require("mz/fs")
const TEST_TIMEOUT = 5000
const fxUtil = require("fx-runner/lib/utils")

const run = async testPath => {
  const extensionPath = path.join(process.cwd(), testPath)
  const driver = await launchBrowser({ extensionPath })
  await runExtensionTest(driver, extensionPath)
  // try {
  //   const log = await driver
  //     .manage()
  //     .logs()
  //     .get(logging.Type.BROWSER)
  //   console.log(log)
  // } catch (error) {
  //   console.error(error)
  // }
}

const runExtensionTest = async (driver, extensionDirName) => {
  const userAgent = await driver.executeScript(() => window.navigator.userAgent)
  console.log(`Connected to browser: ${userAgent}"`)
}

const launchBrowser = async ({ extensionPath }) => {
  process.env.MOZ_DISABLE_CONTENT_SANDBOX = 1
  const binary = await findFirefox(process.env.MOZ_BINARY || "nightly")

  logging.installConsoleHandler()
  const log = new logging.Preferences()
  log.setLevel(logging.Type.BROWSER, logging.Level.DEBUG)

  const capabilities = new Capabilities().set("marionette", true)
  const options = new firefox.Options()
    .setPreference("log", "{level: info}")
    .setBinary(binary)
    .setLoggingPrefs(log)

  if (process.env.HEADLESS === "1") {
    options.headless()
  }

  const service = new firefox.ServiceBuilder(geckodriver.path).setStdio(
    "inherit"
  )

  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    // .withCapabilities(capabilities)
    .build()

  const command = new Command("install addon")
    .setParameter("path", extensionPath)
    .setParameter("temporary", true)

  await driver.execute(command)

  return driver
}

const findFirefox = async binaryPath => {
  const binary = await fxUtil.normalizeBinary(binaryPath)
  if (fs.exists(binary)) {
    return binary
  } else {
    throw new Error(`Could not find ${binaryPath}`)
  }
}

run(process.argv[2])
