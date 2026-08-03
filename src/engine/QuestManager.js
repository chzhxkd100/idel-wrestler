import { MAIN_QUESTS } from '../data/quests/main_quest.js';

export class QuestManager {
  constructor() {
    this.quests = MAIN_QUESTS;
    this.activeQuestIndex = 0;
    this.completedQuests = new Set();
    this.currentQuestState = 'available'; // 'available', 'inProgress', 'canComplete', 'completed'

    this.hudTrackerTitle = null;
    this.hudTrackerDesc = null;
  }

  getCurrentQuest() {
    if (this.activeQuestIndex >= this.quests.length) return null;
    return this.quests[this.activeQuestIndex];
  }

  getNpcQuestStatus(npcId) {
    const q = this.getCurrentQuest();
    if (!q) return null;

    if (q.giverId === npcId && !this.completedQuests.has(q.id)) {
      if (this.currentQuestState === 'available') return 'available'; // Shows '!' over NPC
      if (this.currentQuestState === 'inProgress' && q.targetNpcId === npcId) return 'canComplete'; // Shows '?' over NPC
    }
    if (q.targetNpcId === npcId && this.currentQuestState === 'inProgress') {
      return 'canComplete'; // Shows '?' over NPC
    }
    return null;
  }

  acceptQuest() {
    const q = this.getCurrentQuest();
    if (q && this.currentQuestState === 'available') {
      this.currentQuestState = 'inProgress';
      this.updateHudTracker();
      return true;
    }
    return false;
  }

  completeQuest() {
    const q = this.getCurrentQuest();
    if (q && (this.currentQuestState === 'inProgress' || this.currentQuestState === 'canComplete')) {
      this.completedQuests.add(q.id);
      this.activeQuestIndex++;
      this.currentQuestState = this.activeQuestIndex < this.quests.length ? 'available' : 'completed';
      this.updateHudTracker();
      return q.reward;
    }
    return null;
  }

  updateHudTracker() {
    if (!this.hudTrackerTitle) {
      this.hudTrackerTitle = document.querySelector('#quest-title');
      this.hudTrackerDesc = document.querySelector('#quest-desc');
    }

    const q = this.getCurrentQuest();
    if (!this.hudTrackerTitle || !this.hudTrackerDesc) return;

    if (!q || this.currentQuestState === 'completed') {
      this.hudTrackerTitle.innerText = '🏆 스토리 에피소드 1 완료';
      this.hudTrackerDesc.innerText = '4대 대륙의 평화를 지켰습니다! 자유롭게 탐험하세요.';
    } else {
      const stateBadge = this.currentQuestState === 'available' ? ' [수락 가능]' : ' [진행 중]';
      this.hudTrackerTitle.innerText = q.title + stateBadge;
      this.hudTrackerDesc.innerText = q.description;
    }
  }
}
