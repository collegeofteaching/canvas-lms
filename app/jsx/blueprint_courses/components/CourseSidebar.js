/*
 * Copyright (C) 2017 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import I18n from 'i18n!blueprint_settings'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import select from 'jsx/shared/select'

import Button from 'instructure-ui/lib/components/Button'
import Typography from 'instructure-ui/lib/components/Typography'
import Spinner from 'instructure-ui/lib/components/Spinner'
import Tooltip from 'instructure-ui/lib/components/Tooltip'

import propTypes from '../propTypes'
import actions from '../actions'
import MigrationStates from '../migrationStates'

import BlueprintSidebar from './BlueprintSidebar'
import BlueprintModal from './BlueprintModal'
import { ConnectedMigrationSync as MigrationSync } from './MigrationSync'
import { ConnectedMigrationOptions as MigrationOptions } from './MigrationOptions'

let UnsyncedChanges = null
let SyncHistory = null
let BlueprintAssociations = null

export default class CourseSidebar extends Component {
  static propTypes = {
    realRef: PropTypes.func,
    routeTo: PropTypes.func.isRequired,
    unsyncedChanges: propTypes.unsyncedChanges,
    associations: propTypes.courseList.isRequired,
    migrationStatus: propTypes.migrationState,
    canManageCourse: PropTypes.bool.isRequired,
    hasLoadedAssociations: PropTypes.bool.isRequired,
    hasAssociationChanges: PropTypes.bool.isRequired,
    isSavingAssociations: PropTypes.bool.isRequired,
    isLoadingUnsyncedChanges: PropTypes.bool.isRequired,
    hasLoadedUnsyncedChanges: PropTypes.bool.isRequired,
    isLoadingBeginMigration: PropTypes.bool.isRequired,
    selectChangeLog: PropTypes.func.isRequired,
    loadAssociations: PropTypes.func.isRequired,
    saveAssociations: PropTypes.func.isRequired,
    clearAssociations: PropTypes.func.isRequired,
    enableSendNotification: PropTypes.func.isRequired,
    loadUnsyncedChanges: PropTypes.func.isRequired,
    contentRef: PropTypes.func, // to get reference to the content of the Tray facilitates unit testing
  }

  static defaultProps = {
    unsyncedChanges: [],
    contentRef: null,
    migrationStatus: MigrationStates.states.unknown,
    realRef: () => {},
  }

  state = {
    isModalOpen: false,
    modalId: null,
  }

  componentDidMount () {
    this.props.realRef(this)
  }

  componentWillReceiveProps (nextProps) {
    // if migration is going from a loading state to a non-loading state
    // aka a migration probably just ended and we should refresh the list
    // of unsynced changes
    if (MigrationStates.isLoadingState(this.props.migrationStatus) &&
       !MigrationStates.isLoadingState(nextProps.migrationStatus)) {
      this.props.loadUnsyncedChanges()
    }
  }

  onOpenSidebar = () => {
    if (!this.props.hasLoadedAssociations) {
      this.props.loadAssociations()
    }
    if (!this.props.hasLoadedUnsyncedChanges) {
      this.props.loadUnsyncedChanges()
    }
  }

  modals = {
    associations: () => ({
      props: {
        title: I18n.t('Associations'),
        hasChanges: this.props.hasAssociationChanges,
        isSaving: this.props.isSavingAssociations,
        onSave: this.props.saveAssociations,
        onCancel: () => this.closeModal(() => {
          this.asscBtn.focus()
          this.props.clearAssociations()
        }),
      },
      children: <BlueprintAssociations />,
      onCancel: () => this.closeModal(() => {
        this.asscBtn.focus()
        this.props.clearAssociations()
      }),
    }),
    syncHistory: () => ({
      props: {
        title: I18n.t('Sync History'),
        onCancel: () => this.closeModal(() => {
          if (this.syncHistoryBtn) this.syncHistoryBtn.focus()
        }),
      },
      children: <SyncHistory />,
    }),
    unsyncedChanges: () => ({
      props: {
        title: I18n.t('Unsynced Changes'),
        hasChanges: this.props.unsyncedChanges.length > 0,
        onCancel: () => this.closeModal(() => {
          this.unsyncedChangesBtn.focus()
        }),
        saveButton: <MigrationSync
          showProgress={false}
          onClick={() => this.closeModal(() => {
            if (this.unsyncedChangesBtn) {
              this.unsyncedChangesBtn.focus()
            } else {
              this.syncHistoryBtn.focus()
            }
          })}
        />
      },
      children: <UnsyncedChanges />,
    })
  }

  closeModal = (cb) => {
    this.clearRoutes()
    this.setState({ isModalOpen: false }, cb)
  }

  handleAssociationsClick = () => {
    require.ensure([], (require) => {
      // lazy load BlueprintAssociations component
      const BlueprintAssociationsModule = require('./BlueprintAssociations')
      if (BlueprintAssociations === null) {
        BlueprintAssociations = BlueprintAssociationsModule.ConnectedBlueprintAssociations
      }

      this.setState({
        isModalOpen: true,
        modalId: 'associations',
      })
    })
  }

  handleSyncHistoryClick = () => {
    this.openHistoryModal()
  }

  handleUnsyncedChangesClick = () => {
    require.ensure([], (require) => {
      // lazy load UnsyncedChanges component
      const UnsyncedChangesModule = require('./UnsyncedChanges')
      if (UnsyncedChanges === null) {
        UnsyncedChanges = UnsyncedChangesModule.ConnectedUnsyncedChanges
      }

      this.setState({
        isModalOpen: true,
        modalId: 'unsyncedChanges',
      })
    })
  }

  handleSendNotificationClick = (event) => {
    const enabled = event.target.checked
    this.props.enableSendNotification(enabled)
  }

  clearRoutes = () => {
    this.props.routeTo('#!/')
  }

  openHistoryModal () {
    require.ensure([], (require) => {
      // lazy load SyncHistory component
      const SyncHistoryModule = require('./SyncHistory')
      if (SyncHistory === null) {
        SyncHistory = SyncHistoryModule.ConnectedSyncHistory
      }

      this.setState({
        isModalOpen: true,
        modalId: 'syncHistory',
      })
    })
  }

  showChangeLog (params) {
    this.props.selectChangeLog(params)
    this.openHistoryModal()
  }

  hideChangeLog () {
    this.props.selectChangeLog(null)
  }

  maybeRenderSyncButton () {
    const hasAssociations = this.props.associations.length > 0
    const syncIsActive = MigrationStates.isLoadingState(this.props.migrationStatus)
    const hasUnsyncedChanges = this.props.hasLoadedUnsyncedChanges && this.props.unsyncedChanges.length > 0

    if (hasAssociations && (syncIsActive || hasUnsyncedChanges)) {
      return (
        <div className="bcs__row bcs__row-sync-holder">
          <MigrationSync />
        </div>
      )
    }
    return null
  }

  maybeRenderUnsyncedChanges () {
    // if has no associations or sync in progress, hide
    const hasAssociations = this.props.associations.length > 0
    const isSyncing = MigrationStates.isLoadingState(this.props.migrationStatus) || this.props.isLoadingBeginMigration

    if (!hasAssociations || isSyncing) {
      return null
    }

    // if loading changes, show spinner
    if (!this.props.hasLoadedUnsyncedChanges || this.props.isLoadingUnsyncedChanges) {
      return this.renderSpinner(I18n.t('Loading Unsynced Changes'))
    }

    // if changes are loaded, show me
    if (this.props.hasLoadedUnsyncedChanges && this.props.unsyncedChanges.length > 0) {
      return (
        <div className="bcs__row">
          <Button
            id="mcUnsyncedChangesBtn"
            ref={(c) => { this.unsyncedChangesBtn = c }}
            variant="link"
            onClick={this.handleUnsyncedChangesClick}
          >
            <Typography>{I18n.t('Unsynced Changes')}</Typography>
          </Button>
          <Typography><span className="bcs__row-right-content">{this.props.unsyncedChanges.length}</span></Typography>
          <MigrationOptions />
        </div>
      )
    }

    return null
  }

  maybeRenderAssociations () {
    if (!this.props.canManageCourse) return null
    const isSyncing = MigrationStates.isLoadingState(this.props.migrationStatus) || this.props.isLoadingBeginMigration
    const button = (
      <div className="bcs__row bcs__row__associations">
        <Button disabled={isSyncing} id="mcSidebarAsscBtn" ref={(c) => { this.asscBtn = c }} variant="link" onClick={this.handleAssociationsClick}>
          <Typography>{I18n.t('Associations')}</Typography>
        </Button>
        <Typography><span className="bcs__row-right-content">{this.props.associations.length}</span></Typography>
      </div>
    )

    if (isSyncing) {
      return <Tooltip variant="inverse" tip={I18n.t('Not available during sync')} placement="bottom">{button}</Tooltip>
    } else {
      return button
    }
  }

  renderSpinner (title) {
    return (
      <div style={{textAlign: 'center'}}>
        <Spinner size="small" title={title} />
        <Typography size="small" as="p">{title}</Typography>
      </div>
    )
  }

  renderModal () {
    if (this.modals[this.state.modalId]) {
      const modal = this.modals[this.state.modalId]()
      return <BlueprintModal {...modal.props} isOpen={this.state.isModalOpen}>{modal.children}</BlueprintModal>
    } else {
      return null
    }
  }

  render () {
    return (
      <BlueprintSidebar
        onOpen={this.onOpenSidebar}
        contentRef={this.props.contentRef}
        detachedChildren={this.renderModal()}
      >
        {this.maybeRenderAssociations()}
        <div className="bcs__row">
          <Button id="mcSyncHistoryBtn" ref={(c) => { this.syncHistoryBtn = c }} variant="link" onClick={this.handleSyncHistoryClick}>
            <Typography>{I18n.t('Sync History')}</Typography>
          </Button>
        </div>
        {this.maybeRenderUnsyncedChanges()}
        {this.maybeRenderSyncButton()}
        {}
      </BlueprintSidebar>
    )
  }
}

const connectState = state =>
  Object.assign(select(state, [
    'canManageCourse',
    'hasLoadedAssociations',
    'isLoadingBeginMigration',
    'isSavingAssociations',
    ['existingAssociations', 'associations'],
    'unsyncedChanges',
    'isLoadingUnsyncedChanges',
    'hasLoadedUnsyncedChanges',
    'migrationStatus'
  ]), {
    hasAssociationChanges: (state.addedAssociations.length + state.removedAssociations.length) > 0,
  })
const connectActions = dispatch => bindActionCreators(actions, dispatch)
export const ConnectedCourseSidebar = connect(connectState, connectActions)(CourseSidebar)
