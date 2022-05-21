import Api from '../../services/Api'
import {reduxFetch} from './Api'
import {
    FETCH_GUARDIAN_NODE_DELEGATES
} from "../types/Nodes";

export function fetchSentryNodeDelegates() {
    return reduxFetch(FETCH_GUARDIAN_NODE_DELEGATES, function () {
        return Api.fetchSentryNodeDelegates();
    });
}
