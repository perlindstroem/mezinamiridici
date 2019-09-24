import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

Vue.use(Vuex);

const API_ENDPOINT = 'https://ri5m1kvdnb.execute-api.eu-west-1.amazonaws.com/production/v1';

export default new Vuex.Store({
  state: {
    polls: null,
    poll: null,
    userToken: null,
    userNickname: null
  },
  getters: {
    POLLS: state => state.polls,
    POLL: state => state.poll,
    USER_TOKEN: state => state.userToken,
  },
  mutations: {
    SET_POLLS: (state, payload) => {
      state.polls = payload;
    },
    SET_POLL: (state, payload) => {
      state.poll = payload;
    },
    SET_USER_TOKEN: (state, payload) => {
      state.userToken = payload;
    },
    SET_USER_NICKNAME: (state, payload) => {
      state.userNickname = payload;
    }
  },
  actions: {
    GET_POLLS: async (context, payload) => {
      const { data } = await axios.get(`${API_ENDPOINT}/polls`);
      context.commit('SET_POLLS', data);
    },
    GET_POLL: async (context, payload) => {
      context.commit('SET_POLL', null);
      const { data } = await axios.get(`${API_ENDPOINT}/polls/${payload.id}`);
      context.commit('SET_POLL', data);
    },
    GET_USER_TOKEN: async (context, payload) => {
      context.commit('SET_USER_TOKEN', null);

      const request = await axios.post(`${API_ENDPOINT}/authorizeUser`, JSON.stringify({
        email: payload.email,
        password: payload.password,
      }));

      context.commit('SET_USER_TOKEN', request.data);
      return request;
    },
    GET_USER_NICKNAME: async (context, payload) => {
      console.log(jwtDecode(localStorage.setItem('jwt', response.data.token)));
    }
  },
});
