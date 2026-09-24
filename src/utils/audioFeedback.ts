/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Sound effects completely disabled per user request
class AudioFeedback {
  public setEnabled(_val: boolean) {}
  public playPinDrop() {}
  public playScoreCelebration(_score: number) {}
}

export const audioFeedback = new AudioFeedback();
