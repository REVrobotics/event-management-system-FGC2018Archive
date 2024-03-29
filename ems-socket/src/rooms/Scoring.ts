import {Server, Socket} from "socket.io";
import {IRoom} from "./IRoom";
import logger from "../logger";
import MatchTimer from "../scoring/MatchTimer";
import ScoreManager from "../scoring/ScoreManager";
import ScoringTimerContainer from "../scoring/ScoringTimerContainer";
import RefereeEvents from "../scoring/energy-impact/RefereeEvents";
import {MatchMode} from "../scoring/MatchMode";

export default class ScoringRoom implements IRoom {
  private readonly _server: Server;
  private readonly _clients: Socket[];
  private readonly _name: string;
  private readonly _timer: MatchTimer;
  private _hasCommittedScore: boolean;

  constructor(server: Server, matchTimer: MatchTimer) {
    this._server = server;
    this._clients = [];
    this._name = "scoring";
    this._timer = matchTimer;
    this._hasCommittedScore = false;
  }

  public addClient(client: Socket) {
    this._clients.push(client);
    this.initializeEvents(client);
    logger.info(`Client ${client.id} joined '${this._name}'.`);
  }

  public removeClient(client: Socket) {
    if (this._clients.indexOf(client) > -1) {
      this._clients.splice(this._clients.indexOf(client), 1);
      logger.info(`Client ${client.id} left ${this._name}'.`);
    }
  }

  public getClients(): Socket[] {
    return this._clients;
  }

  private initializeEvents(client: Socket) {
    // In case EMS disconnects mid-match.
    if (!this._timer.inProgress() && this._timer.mode === MatchMode.ENDED && !this._hasCommittedScore) {
      logger.info("Detected that client previously disconnected during match. Sending last match results.");
      client.emit("score-update", ScoreManager.match.toJSON());
      setTimeout(() => {
        client.emit("match-end");
      }, 250);
    }

    client.on("request-video", (id: number) => {
      this._server.to("scoring").emit("video-switch", id);
    });
    client.on("prestart", (matchKey: string, fieldNumber: number) => {
      this._server.to("scoring").emit("prestart", matchKey, fieldNumber);
      RefereeEvents.resetVariables();
      ScoreManager.resetMatch();
      // const details: object = {
      //   red: ScoreManager.getDetails("red").toJSON(),
      //   blue: ScoreManager.getDetails("blue").toJSON()
      // };
      // this._server.to("referee").emit("onFreshTablet", {scores: [ScoreManager.match.redScore, ScoreManager.match.blueScore], md: details, prevReactor: RefereeEvents.prevReactor, prevYellowCards: RefereeEvents.prevYellowCards, prevRedCards: RefereeEvents.prevRedCards, prevBotsParked: RefereeEvents.prevBotsParked, status: "PRESTART"});
    });
    client.on("commit-scores", (matchKey: string) => {
      this._server.to("scoring").emit("commit-scores", matchKey);
      this._hasCommittedScore = true;
    });
    client.on("start", () => {
      if (!this._timer.inProgress()) {
        this._timer.once("match-start", (timeLeft: number) => {
          const details: object = {
            red: ScoreManager.getDetails("red").toJSON(),
            blue: ScoreManager.getDetails("blue").toJSON()
          };
          this._server.to("scoring").emit("match-start", timeLeft);
          this._hasCommittedScore = false;
        });
        this._timer.once("match-auto", () => {
          this._server.to("scoring").emit("match-auto");
        });
        this._timer.once("match-tele", () => {
          this._server.to("scoring").emit("match-tele");
        });
        this._timer.once("match-endgame", () => {
          this._server.to("scoring").emit("match-endgame");
        });
        this._timer.once("match-end", () => {
          this._server.to("scoring").emit("match-end");
          this._timer.removeAllListeners("match-abort");
          ScoringTimerContainer.stopAll();
          RefereeEvents.resetVariables();
        });
        this._timer.once("match-abort", () => {
          this._server.to("scoring").emit("match-abort");
          this._timer.removeAllListeners("match-end");
          ScoringTimerContainer.stopAll();
          RefereeEvents.resetVariables();
        });
        this._timer.start();
      }
    });
    client.on("abort", () => {
      if (this._timer.inProgress()) {
        this._timer.abort();
      }
    });
    client.on("update-timer", (timerJSON: any) => {
      if (!this._timer.inProgress()) {
        if (typeof timerJSON.delay_time !== "undefined") {
          this._timer.delayTime = timerJSON.delay_time;
        }
        if (typeof timerJSON.auto_time !== "undefined") {
          this._timer.autoTime = timerJSON.auto_time;
        }
        if (typeof timerJSON.tele_time !== "undefined") {
          this._timer.teleTime = timerJSON.tele_time;
        }
        if (typeof timerJSON.end_time !== "undefined") {
          this._timer.endTime = timerJSON.end_time;
        }
      }
    });
  }

  get name(): string {
    return this._name;
  }
}
