import AppError from "../models/AppError";
import Team from "../models/Team";
import {TournamentLevels} from "../AppTypes";
import Match from "../models/Match";
import MatchParticipant from "../models/MatchParticipant";

const ipcRenderer = (window as any).require("electron").ipcRenderer;

interface IMatchMakerOptions {
  teams: number,
  rounds: number,
  quality: string,
  teamsPerAlliance: number,
  fields: number,
  eventKey: string,
  type: TournamentLevels
}

class MatchMakerManager {
  private static _instance: MatchMakerManager;

  public static getInstance(): MatchMakerManager {
    if (typeof MatchMakerManager._instance === "undefined") {
      MatchMakerManager._instance = new MatchMakerManager();
    }
    return MatchMakerManager._instance;
  }

  private constructor() {}

  public execute(options: IMatchMakerOptions): Promise<Match[]> {
    return new Promise<any>((resolve, reject) => {
      ipcRenderer.once("match-maker-success", (event: any, data: any) => {
        const matches: Match[] = [];
        for (const matchJSON of data) {
          const match = new Match().fromJSON(matchJSON);
          const participants: MatchParticipant[] = [];
          for (const participantJSON of matchJSON.participants) {
            participants.push(new MatchParticipant().fromJSON(participantJSON));
          }
          match.participants = participants;
          matches.push(match);
        }
        resolve(matches);
      });
      ipcRenderer.once("match-maker-error", (event: any, error: any) => {
        reject(new AppError(1500, "MATCH_MAKER_RUN", error));
      });
      ipcRenderer.send("match-maker", options);
    });
  }

  public createTeamList(teamList: Team[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      ipcRenderer.once("match-maker-teams-success", (event: any, data: any) => {
        resolve(data);
      });
      ipcRenderer.once("match-maker-teams-error", (event: any, error: any) => {
        reject(new AppError(1501, "MATCH_MAKER_TEAMS", error));
      });
      ipcRenderer.send("match-maker-teams", teamList.map(team => team.teamKey));
    });
  }

}

export default MatchMakerManager.getInstance();