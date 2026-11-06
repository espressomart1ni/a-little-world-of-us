const OPTIONS = [
  { label: 'How are you?',
    replies: ["I'm good! Even better now that you're here.", "I'm good, baby. Just thinking about you.", "I'm good! Just a little cozy and a little sleepy."] },
  { label: 'Do you want cuddles?',
    replies: ["Yes, please! I've been waiting for you to ask.", "Always. Come here, baby.", "Yes! I need cuddles and a nap with you."],
    heart: true,
    followUp: [
      ['Yash', "Let's go snuggle up on the bed, then."],
      ['Arkisha', "Race you there! ...Okay, I'll wait for you. Walk slowly."],
    ],
    action: 'cuddle' },
  { label: 'I love you',
    replies: ['I love you too!!', 'I love you more. Always.', 'I love you too, my person.'], heart: true },
  { label: 'Do you wanna have pizza together and watch a movie?',
    say: "Let's watch a movie and eat pizza together.",
    replies: ['Yes I would love that!!', "Yes!! Pizza and a movie with you is my favourite thing."], action: 'pizza' },
  { label: "Let's have sex",
    replies: ["Mmm, I thought you'd never ask.", "Yes, baby. Come here."], action: 'intimate' },
];

const CLOSED = new Error('closed');
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export async function talkToArkisha(scene) {
  const d = scene.dialogue, ark = scene.Arkisha;
  if (scene.movieNight.armed) {
    d.show('Arkisha', ['Grab a slice first, baby! The pizza box is by the rug.']);
    return;
  }
  const say = async (n, t) => { if (!(await d.say(n, t))) throw CLOSED; };
  ark.setBusy(true);
  try {
    await say('Yash', 'Hi baby');
    await say('Arkisha', 'Hiiiiii!');
    while (true) {
      const i = await d.choose([...OPTIONS.map((o) => o.label), 'Bye for now']);
      if (i < 0) throw CLOSED;
      if (i === OPTIONS.length) {
        await say('Yash', 'Gotta go, baby. Love you!');
        await say('Arkisha', 'Bye bye! Come back soon.');
        break;
      }
      const o = OPTIONS[i];
      await say('Yash', o.say || o.label);
      if (o.heart) ark.emote('heart');
      await say('Arkisha', pick(o.replies));

      if (o.action === 'cuddle') {
        for (const [who, line] of o.followUp) await say(who, line);
        d.close();
        ark.setBusy(false);              // free her so she can walk to the bed
        await scene.bedCuddle.start();   // Yash climbs up, Arkisha joins him
        break;
      }
      if (o.action === 'pizza') {
        await say('Arkisha', "Open the pizza box and grab a slice. I'll set up the movie!");
        d.close();
        scene.movieNight.arm();          // she walks to the table; the rest is up to you
        break;
      }
      if (o.action === 'intimate') {
        d.close();
        await scene.cinematic('...a little while later...', 'sfx-clapping');
        ark.snapTo('cuddle');
        scene.yash.gx = 3.6; scene.yash.gy = 5.4; scene.yash.sync();
        for (let k = 0; k < 3; k++) scene.time.delayedCall(k * 350, () => ark.emote('heart'));
        await say('Arkisha', 'I love you so much, Yash.');
        break;
      }
    }
  } catch (e) {
    if (e !== CLOSED) throw e;
  } finally {
    d.close();
    ark.setBusy(false);
  }
}