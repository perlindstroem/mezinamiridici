<template>
  <div>
    <div class="poll-voting__wrapper">
      <div class="poll-voting__content">
        <PollHeading :item="item"/>

        <div v-if="votedAlready === true" class="poll-voting__chart-wrapper">
          <h2 class="poll-voting__chart-wrapper-vote">
            {{ $t('poll.your-vote') }} <span class="vote-text">{{ $t('poll.choices.'+voted) }}</span>
          </h2>
          <div class="poll-voting__chart-wrapper-bar-chart" v-if="voting === false || votedAlready === true">
            <BarChart :votes="item.votes" v-bind:voted="voted" />
          </div>

          <content-loader
            :height="200"
            :width="400"
            :speed="22"
            primaryColor="#f3f3f3"
            secondaryColor="#ecebeb"
            class="poll-voting__chart-wrapper-bar-chart"
            v-if="voting"
          >
            <rect x="50" y="9.61" rx="3" ry="3" width="40" height="200" />
            <rect x="130" y="9.61" rx="3" ry="3" width="40" height="200" />
            <rect x=210 y="7.61" rx="3" ry="3" width="40" height="200" />
            <rect x="290" y="7.61" rx="3" ry="3" width="40" height="200" />
          </content-loader>

<!--            <div class="poll-voting__chart-wrapper-analyze-votes-button">-->
<!--              <Button :value="$t('poll.analyze-votes')" @clicked="redirectToAnalyzeVotes" />-->
<!--            </div>-->
        </div>
        <div v-if="!votedAlready">
          <PollButtons @voted="voted" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ContentLoader } from 'vue-content-loader';
import PollHeading from '@/components/molecules/PollHeading.vue';
import PollButtons from '@/components/molecules/PollButtons.vue';
import BarChart from '@/components/molecules/charts/BarChart.vue';
// import Button from '@/components/atoms/Button.vue';

export default {
  name: 'CompletePoll',
  components: {
    ContentLoader,
    // Button,
    BarChart,
    PollButtons,
    PollHeading,
  },
  props: {
    item: Object,
  },
  data() {
    return {
      voting: false,
      votedAlready: null,
      voted: 'trivial', // todo from db
    };
  },
  computed: {
  },
  async created() {
    this.voting = false;
  },
  methods: {
    async performVote(vote) {
      this.voting = true;
      await this.$store.dispatch('VOTE', {
        id: this.poll._id,
        vote,
      });
      this.voting = false;
      this.votedAlready = true;
    },
    redirectToAnalyzeVotes() {
      this.$router.push({ name: 'analyze-votes', params: { id: this.id } });
    },
  },
};
</script>

<style>
.poll-voting__wrapper {
    grid-template-columns: 1fr;
    display: grid;
    margin: 0 auto;
    padding: 1em 0;
    grid-gap: 20px;
}

.poll-voting__chart-wrapper {
  grid-template-columns: 1fr 1fr 1fr 1fr;
  display: grid;
  padding: 1em 0;
  grid-gap: 20px;
}

.poll-voting__discussion-break-out {
  background: #f6f6f6;
}

.poll-voting__discussion-wrapper {
    grid-template-columns: 1fr;
    display: grid;
    margin: 0 auto;
    max-width: 80%;
    padding: 1em 0;
}

.poll-voting__chart-wrapper-vote {
  grid-column: 1 / span 4
}

.poll-voting__chart-wrapper-bar-chart {
  grid-column: 1 / span 4;
  margin: 0 auto;
  max-width: 80%;
}

.poll-voting__chart-wrapper-analyze-votes-button {
  grid-column: 1 / span 4;
  margin: 0 auto;
}

.poll-voting__content {
  order: 2;
}

.poll-voting__ads {
  height: 100%;
  background: grey;
  order: 1;
}

.vote-text {
  color: red;
}

.poll-voting__other-polls {
  grid-template-columns: 1fr;
  display: grid;
  text-align:center;
}

.poll-voting__other-polls-button {
  width: 30%;
}

.poll-voting__double-line {
  margin-top: -20px;
}

@media all and (min-width: 850px) {
  .poll-voting__content {
    order: 1;
  }

  .poll-voting__ads {
    order: 2;
  }

  .poll-voting__other-polls {
    width: 50%;
  }
}
</style>
