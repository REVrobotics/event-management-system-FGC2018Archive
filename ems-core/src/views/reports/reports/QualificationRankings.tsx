import * as React from "react";
import Team from "../../../shared/models/Team";
import EventConfiguration from "../../../shared/models/EventConfiguration";
import ReportTemplate from "./ReportTemplate";
import EMSProvider from "../../../shared/providers/EMSProvider";
import {AxiosResponse} from "axios";
import HttpError from "../../../shared/models/HttpError";
import DialogManager from "../../../shared/managers/DialogManager";
import Ranking from "../../../shared/models/Ranking";
import {IApplicationState} from "../../../stores";
import {connect} from "react-redux";
import {EMSEventTypes} from "../../../shared/AppTypes";
import EnergyImpactRanking from "../../../shared/models/EnergyImpactRanking";
import EnergyImpactRankTable from "../../../components/game-specifics/EnergyImpactRankTable";

interface IProps {
  eventConfig?: EventConfiguration,
  onHTMLUpdate: (htmlStr: string) => void
}

interface IState {
  generated: boolean,
  rankings: Ranking[]
}

class QualificationRankings extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      generated: false,
      rankings: []
    };
  }

  public componentDidMount() {
    EMSProvider.getRankingTeams().then((rankRes: AxiosResponse) => {
      const rankings: Ranking[] = [];
      if (rankRes.data && rankRes.data.payload && rankRes.data.payload.length > 0) {
        for (const rankJSON of rankRes.data.payload) {
          const ranking: Ranking = this.getByEventType(this.props.eventConfig.eventType).fromJSON(rankJSON);
          ranking.team = new Team().fromJSON(rankJSON);
          rankings.push(ranking);
        }
      }
      this.setState({generated: true, rankings: rankings});
    }).catch((error: HttpError) => {
      DialogManager.showErrorBox(error);
      this.setState({generated: true});
    });
  }

  // TODO - We already have game-specific rank tables... Use them?
  public render() {
    const {onHTMLUpdate, eventConfig} = this.props;
    const {generated, rankings} = this.state;
    let view = this.getRankingTable(eventConfig.eventType);
    if (rankings.length <= 0) {
      view = (<span>There are no rankings to report.</span>);
    }
    return (
      <ReportTemplate
        generated={generated}
        name={"Qualification Rankings"}
        updateHTML={onHTMLUpdate}
        children={view}
      />
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

export default connect(mapStateToProps)(QualificationRankings);