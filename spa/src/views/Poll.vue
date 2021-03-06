<template>
  <div>
    <div class="poll__wrapper">
      <div class="poll__ads">
        Ads
      </div>

      <CompletePoll class="poll__voting" :id="id" :vote="vote" />
    </div>

    <div class="poll__discussion-break-out">
      <div class="poll__discussion-wrapper">
        <h2>{{ $t('poll.discussion') }} ({{comments ? comments.length : 0}})</h2>

        <div v-if="signedIn">
          <h3>{{ $t('poll.your-say') }}</h3>
          <Textarea :id="id" />
        </div>

        <Comments :pollId="id" :comments="comments" :depth="parseInt(0)" v-if="comments" />

        <div class="poll__other-polls">
          <h2>
            <Button :value="$t('poll.other-polls-button')" class="poll__other-polls-button" @clicked="redirectToOtherPolls" />
            <hr class="poll__double-line" />
            <hr class="poll__double-line" />
          </h2>
        </div>
      </div>
      </div>
  </div>
</template>

<script>
import CompletePoll from '@/components/organisms/CompletePoll.vue';
import Button from '@/components/atoms/Button.vue';
import Textarea from '@/components/atoms/Textarea.vue';
import Comments from '@/components/organisms/Comments.vue';

export default {
  name: 'poll',
  components: {
    Button,
    Comments,
    Textarea,
    CompletePoll,
  },
  props: {
    slug: String,
    vote: String,
  },
  created() {
    this.$store.dispatch('GET_POLL', { slug: this.slug });
  },
  methods: {
    redirectToOtherPolls() {
      this.$router.push({ name: 'polls' });
    },
    redirectToAnalyzeVotes() {
      this.$router.push({ name: 'analyze-votes', params: { id: this.id } });
    },
    recursivelyBuildComments(allComments, commentsToSearchThrough) {
      allComments.forEach((comment) => {
        if (comment.parent) {
          commentsToSearchThrough.forEach((x) => {
            if (!x.comments) return;
            const found = x.comments.find(y => y.commentId === comment.parent);

            if (found) {
              found.comments = [comment];
              this.recursivelyBuildComments(allComments, x.comments);
            }
          });
        }
      });
    },
  },
  computed: {
    signedIn() {
      return this.$store.getters.IS_AUTHORIZED;
    },
    comments() {
      const comments = this.$store.getters.POLL_COMMENTS;

      if (!comments) return [];

      const commentsTree = [];

      comments.forEach((comment) => {
        if (!comment.parent) {
          commentsTree.push(comment);
        }
      });

      comments.forEach((comment) => {
        if (comment.parent) {
          const found = commentsTree.find(x => x.commentId === comment.parent);

          if (found) {
            found.comments = [comment];
          }
        }
      });

      this.recursivelyBuildComments(comments, commentsTree);

      return commentsTree.sort((a, b) => ((a.created < b.created) ? 1 : -1));
    },
  },
};
</script>

<style>
.poll__wrapper {
    grid-template-columns: 1fr;
    display: grid;
    margin: 0 auto;
    max-width: 80%;
    padding: 1em 0;
    grid-gap: 20px;
}

.poll__discussion-break-out {
  background: #f6f6f6;
}

.poll__discussion-wrapper {
    grid-template-columns: 1fr;
    display: grid;
    margin: 0 auto;
    max-width: 80%;
    padding: 1em 0;
}

.poll__ads {
  height: 100%;
  background: grey;
  order: 1;
}

.poll__voting  {
  order: 2;
}

.poll__other-polls {
  grid-template-columns: 1fr;
  display: grid;
  text-align:center;
}

.poll__other-polls-button {
  width: 30%;
}

.poll__double-line {
  margin-top: -20px;
}

@media all and (min-width: 850px) {
  .poll__wrapper {
    grid-template-columns: 1fr 0.2fr;
  }
  .poll__voting  {
    order: 1;
  }

  .poll__ads {
    order: 2;
  }

  .poll__other-polls {
    width: 50%;
  }
}
</style>
