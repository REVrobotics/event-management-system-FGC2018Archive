import * as React from "react";
import {getTheme} from "../shared/AppTheme";
import {Card} from "semantic-ui-react";
import {IApplicationState} from "../stores";
import EventConfiguration from "../shared/models/EventConfiguration";
import Ranking from "../shared/models/Ranking";
import EMSProvider from "../shared/providers/EMSProvider";
import {AxiosResponse} from "axios";
import DialogManager from "../shared/managers/DialogManager";
import HttpError from "../shared/models/HttpError";
import {EMSEventTypes} from "../shared/AppTypes";
import EnergyImpactRankTable from "./game-specifics/EnergyImpactRankTable";
import EnergyImpactRanking from "../shared/models/EnergyImpactRanking";
import {connect} from "react-redux";
import Team from "../shared/models/Team";

interface IProps {
  eventConfig?: EventConfiguration
}

interface IState {
  rankings: Ranking[]
}

class SetupRankingsOverview extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      rankings: []
    }
  }

  public componentDidMount() {
    EMSProvider.getRankingTeams().then((response: AxiosResponse) => {
      const rankings: Ranking[] = [];
      if (response.data.payload && response.data.payload.length > 0) {
        for (let i = 0; i < this.props.eventConfig.rankingCutoff; i++) {
          const ranking: Ranking = this.getByEventType(this.props.eventConfig.eventType).fromJSON(response.data.payload[i]);
          ranking.team = new Team().fromJSON(response.data.payload[i]);
          rankings.push(ranking);
        }
      }
      this.setState({rankings: rankings});
    }).catch((error: HttpError) => {
      DialogManager.showErrorBox(error);
    });
  }

  public render() {
    const {eventConfig} = this.props;
    return (
      <div className="step-view-tab">
        <Card fluid={true} color={getTheme().secondary}>
          <Card.Content>
            {
              typeof eventConfig.rankingCutoff === "undefined" || eventConfig.rankingCutoff <= 0 &&
              <span><i>You currently don't have a valid ranking cutoff for finals matches. Please go over to the 'settings' tab and provide a valid value.</i></span>
            }
            {
              typeof eventConfig.rankingCutoff !== "undefined" && eventConfig.rankingCutoff > 0 &&
              <span><i>The following teams have qualified for finals matches based upon the ranking cutoff. Once you have finished your qualification matches, head over to the 'Schedule Parameters' tab to generate a finals schedule.</i></span>
            }
          </Card.Content>
          <Card.Content>
            {this.getRankingTable(eventConfig.eventType)}
          </Card.Content>
        </Card>
      </div>
    );
  }

  private getByEventType(eventType: EMSEventTypes): Ranking {
    switch (eventType) {
      case "fgc_2018":
        return new EnergyImpactRanking();
      default:
        return new Ranking();
    }
  }

  private getRankingTable(eventType: EMSEventTypes) {
    switch (eventType) {
      case "fgc_2018":
        return <EnergyImpactRankTable rankings={this.state.rankings as EnergyImpactRanking[]} identifier={this.props.eventConfig.teamIdentifier}/>;
      default:
        return <EnergyImpactRankTable rankings={this.state.rankings as EnergyImpactRanking[]}/>;
    }
  }
}

export function mapStateToProps({configState}: IApplicationState) {
  return {
    eventConfig: configState.eventConfiguration
  };
}

export default connect(mapStateToProps)(SetupRankingsOverview);