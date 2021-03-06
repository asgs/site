/* Main entry of all requests */
import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom' // eslint-disable-line
import Head from './fragments/Head'
import Scripts from './fragments/GlobalScripts'
import SubscribeModal from './fragments/SubscribeModal'
import initializeAnalytics from './utils/analytics/init'
import initUAClasses from './utils/brower-detect'
import fixChromeHash from './utils/fixChromeHash'
import { setItem, getItem } from './utils/storage' // eslint-disable-line
import { initializeRouteListener, handleRouteChange } from './utils/routerUtils'
import track from './utils/analytics/track'
import identify from './utils/analytics/identify'
import { customerIOPageView } from './utils/analytics/page'
import './index.global.css'
import styles from './index.css'
// import deleteServiceWorkers from './utils/deleteServiceWorkers'

if (typeof window !== 'undefined') {
  // deleteServiceWorkers()
  // expose React for app scripts
  window.React = React
  window.ReactDOM = ReactDOM
  // enable listerers on route changes without react-router-redux
  initializeRouteListener()
}

const propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  /** React Router params **/
  params: PropTypes.object,
  location: PropTypes.object,
  history: PropTypes.object,
}

export default class App extends Component {
  // Initial App mount. Happens once
  componentDidMount() {
    initializeAnalytics()
    // add browser based classes
    initUAClasses()
    // chrome ignores hash anchors ¯\_(ツ)_/¯...
    fixChromeHash()
    window.addEventListener('routerRedirect', this.handleAuthRedirect, false)
    window.onpopstate = history.onpushstate = handleRouteChange
  }
  componentWillUnmount() {
    window.removeEventListener('routerRedirect', this.handleAuthRedirect)
  }
  handleAuthRedirect = (e) => {
    const redirectURL = e.detail.url
    const profile = e.detail.profile
    // handle redirect
    this.props.history.push(redirectURL)
    // handle analytics save
    if (profile && profile.login_count === 1) {
      track('site:account_created', {
        label: 'Account Signup'
      })
    }
    // handle user identification
    if (profile && profile.user_id) {
      // check for mergeInProgress
      const id = profile.tracking_id || profile.user_id
      // ID user
      identify(id, profile)

      setTimeout(() => {
        customerIOPageView()
      }, 0)
    }
  }
  render() {
    const { location, params } = this.props
    const currentQuery = location && location.query
    return (
      <div className={styles.app}>
        <Head />
        <div className={styles.content}>
          {this.props.children}
        </div>
        <SubscribeModal />
        <Scripts params={params} query={currentQuery} />
      </div>
    )
  }
}

App.propTypes = propTypes
