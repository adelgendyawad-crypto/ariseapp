import { GoogleGenAI } from '@google/genai';
import { Attendee, Team } from '../types';

export async function generateConventionHypeCommentary(
  teams: Record<string, Team>,
  teamScores: Record<string, number>,
  topAttendees: Attendee[]
): Promise<{ title: string; commentary: string; mvpHonorable: string; tipForHost: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

    const teamBreakdown = Object.values(teams).map(t => `${t.name}: ${teamScores[t.id] || 0} pts`).join(', ');
    const topLeader = topAttendees[0] ? `${topAttendees[0].name} (${topAttendees[0].points} pts)` : 'None';

    const prompt = `You are the stadium game master for a convention points tournament.
Current standings:
Teams: ${teamBreakdown || 'Tournament Active'}
Leading MVP: ${topLeader}

Produce a live announcer bulletin for the main convention hall screen.
Respond strictly in valid JSON matching this structure:
{
  "title": "Short Catchy Broadcast Headline",
  "commentary": "2-3 dynamic sentences summarizing the team score clash and momentum swing",
  "mvpHonorable": "A quick shout-out for the highest scoring individual player",
  "tipForHost": "A 1-sentence prompt for game hosts to fire up the crowd"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      title: parsed.title || 'Convention Arena Live Broadcast',
      commentary: parsed.commentary || 'The points race is heating up across all convention divisions! Every tap counts toward the final trophy.',
      mvpHonorable: parsed.mvpHonorable || `Special salute to our tournament leader ${topLeader}!`,
      tipForHost: parsed.tipForHost || 'Call out the 2nd place team to challenge the leaders in the next breakout session!'
    };
  } catch (error) {
    console.warn('Gemini commentary fallback:', error);
    return getFallbackCommentary(teams, teamScores, topAttendees);
  }
}

function getFallbackCommentary(
  teams: Record<string, Team>,
  teamScores: Record<string, number>,
  topAttendees: Attendee[]
) {
  const topLeader = topAttendees[0] ? `${topAttendees[0].name} with ${topAttendees[0].points} pts` : 'Top Contenders';
  const teamList = Object.values(teams);
  const leadingTeam = teamList.sort((a, b) => (teamScores[b.id] || 0) - (teamScores[a.id] || 0))[0];

  return {
    title: leadingTeam ? `${leadingTeam.name} Holds 1st Place!` : 'Convention Championship Underway',
    commentary: leadingTeam
      ? `${leadingTeam.mascot} ${leadingTeam.name} leads with ${teamScores[leadingTeam.id] || 0} total points! Every attendee wristband tap is updating group scores in real time.`
      : 'Scores are updating live in real-time from NFC wristbands across the convention center floor! Check in at tournament booths to tally group points.',
    mvpHonorable: topAttendees[0] ? `Tournament MVP leader: ${topLeader} setting the benchmark!` : 'Great team efforts underway across all groups!',
    tipForHost: 'Announce a sudden-death +10 point lightning trivia round to rally the teams!'
  };
}
