import React from 'react';
import { useDispatch } from 'react-redux';
import { identify, track } from '@/utils/analytics';
import { MessageFromPluginTypes, MessageToPluginTypes, PostToUIMessage } from '@/types/messages';
import { postToFigma } from '../../plugin/notifiers';
import useRemoteTokens from '../store/remoteTokens';
import { Dispatch } from '../store';
import useStorage from '../store/useStorage';

export function Initiator() {
  const dispatch = useDispatch<Dispatch>();

  const { pullTokens } = useRemoteTokens();
  const { setStorageType } = useStorage();

  const onInitiate = () => {
    postToFigma({ type: MessageToPluginTypes.INITIATE });
  };

  React.useEffect(() => {
    onInitiate();
    window.onmessage = async (event: {
      data: {
        pluginMessage: PostToUIMessage
      }
    }) => {
      if (event.data.pluginMessage) {
        const { pluginMessage } = event.data;
        switch (pluginMessage.type) {
          case MessageFromPluginTypes.SELECTION: {
            const { values } = pluginMessage;
            dispatch.uiState.setDisabled(false);
            if (values) {
              dispatch.uiState.setSelectionValues(values);
            } else {
              dispatch.uiState.resetSelectionValues();
            }
            break;
          }
          case MessageFromPluginTypes.NO_SELECTION: {
            dispatch.uiState.setDisabled(true);
            dispatch.uiState.resetSelectionValues();
            break;
          }
          case MessageFromPluginTypes.REMOTE_COMPONENTS:
            break;
          case MessageFromPluginTypes.TOKEN_VALUES: {
            const { values } = pluginMessage;
            if (values) {
              dispatch.tokenState.setTokenData(values);
              dispatch.uiState.setActiveTab('tokens');
            }
            break;
          }
          case MessageFromPluginTypes.STYLES: {
            const { values } = pluginMessage;
            if (values) {
              track('Import styles');
              dispatch.tokenState.setTokensFromStyles(values);
              dispatch.uiState.setActiveTab('tokens');
            }
            break;
          }
          case MessageFromPluginTypes.RECEIVED_STORAGE_TYPE:
            setStorageType({ provider: pluginMessage.storageType });
            break;
          case MessageFromPluginTypes.API_CREDENTIALS: {
            const { status, credentials } = pluginMessage;
            if (status === true) {
              track('Fetched from remote', { provider: credentials.provider });
              if (!credentials.internalId) track('missingInternalId', { provider: credentials.provider });

              dispatch.uiState.setApiData(credentials);
              dispatch.uiState.setLocalApiState(credentials);
              await pullTokens(credentials);
              dispatch.uiState.setActiveTab('tokens');
            }
            break;
          }
          case MessageFromPluginTypes.API_PROVIDERS: {
            dispatch.uiState.setAPIProviders(pluginMessage.providers);
            break;
          }
          case MessageFromPluginTypes.UI_SETTINGS: {
            dispatch.settings.setUISettings(pluginMessage.settings);
            dispatch.settings.triggerWindowChange();
            break;
          }
          case MessageFromPluginTypes.USER_ID: {
            identify(pluginMessage.user);
            track('Launched');
            break;
          }
          case MessageFromPluginTypes.RECEIVED_LAST_OPENED: {
            dispatch.uiState.setLastOpened(pluginMessage.lastOpened);
            break;
          }
          case MessageFromPluginTypes.START_JOB: {
            dispatch.uiState.startJob(pluginMessage.job);
            break;
          }
          case MessageFromPluginTypes.COMPLETE_JOB: {
            dispatch.uiState.completeJob(pluginMessage.name);
            break;
          }
          case MessageFromPluginTypes.CLEAR_JOBS: {
            dispatch.uiState.clearJobs();
            break;
          }
          case MessageFromPluginTypes.ADD_JOB_TASKS: {
            dispatch.uiState.addJobTasks({
              name: pluginMessage.name,
              count: pluginMessage.count,
              expectedTimePerTask: pluginMessage.expectedTimePerTask,
            });
            break;
          }
          case MessageFromPluginTypes.COMPLETE_JOB_TASKS: {
            dispatch.uiState.completeJobTasks({
              name: pluginMessage.name,
              count: pluginMessage.count,
              timePerTask: pluginMessage.timePerTask,
            });
            break;
          }
          default:
            break;
        }
      }
    };
  }, []);

  return null;
}
