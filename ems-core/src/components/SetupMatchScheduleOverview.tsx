import * as React from "react";
import {Button, Card, Divider, Table} from "semantic-ui-react";
import {getTheme} from "../shared/AppTheme";
import {TournamentLevels} from "../shared/AppTypes";
import EventConfiguration from "../shared/models/EventConfiguration";
import {IApplicationState} from "../stores";
import {connect} from "react-redux";
import Match from "../shared/models/Match";
import {IDisableNavigation} from "../stores/internal/types";
import ConfirmActionModal from "./ConfirmActionModal";

interface IProps {
  onComplete: () => void,
  type: TournamentLevels,
  matchList: Match[],
  eventConfig?: EventConfiguration,
  navigationDisabled?: boolean,
  setNavigationDisabled?: (disabled: boolean) => IDisableNavigation
}

interface IState {
  confirmModalOpen: boolean
}

class SetupMatchScheduleOverview extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      confirmModalOpen: false
    };
    this.openConfirmModal = this.openConfirmModal.bind(this);
    this.closeConfirmModal = this.closeConfirmModal.bind(this);
    this.publish = this.publish.bind(this);
  }

  public render() {
    const {confirmModalOpen} = this.state;

    const tpa = (this.props.type === "Qualification" || this.props.type === "Practice") ? this.props.eventConfig.teamsPerAlliance : this.props.eventConfig.postQualTeamsPerAlliance;

    const redLabels = [];
    for (let i = 0; i < tpa; i++) {
      redLabels.push(
        <Table.HeaderCell key={i + "-red"} width={2}>Red {i + 1}</Table.HeaderCell>
      );
    }

    const blueLabels = [];
    for (let i = 0; i < tpa; i++) {
      blueLabels.push(
        <Table.HeaderCell key={i + "-blue"} width={2}>Blue {i + 1}</Table.HeaderCell>
      );
    }

    const matchesView = this.props.matchList.map(match => {
      let participantsView: any[] = [];
      if (typeof match.participants === "undefined") {
        for (let i = 0; i < (tpa * 2); i++) {
          participantsView.push(
            <Table.Cell key={match.matchKey + "-" + i} width={2}><b>TBD</b></Table.Cell>
          );
        }
      } else {
        participantsView = match.participants.map(participant => {
          return (
            <Table.Cell key={participant.matchParticipantKey} width={2}>{participant.surrogate ? (participant.teamKey + "*") : participant.teamKey}</Table.Cell>
          );
        });
      }
      return (
        <Table.Row key={match.matchKey}>
          <Table.Cell width={2}>{match.matchName}</Table.Cell>
          <Table.Cell width={1}>{match.fieldNumber}</Table.Cell>
          <Table.Cell width={1}>{match.scheduledStartTime.format("ddd, h:mma")}</Table.Cell>
          {participantsView}
        </Table.Row>
      );
    });

    return (
      <div className="step-view-tab">
        <ConfirmActionModal open={confirmModalOpen} onClose={this.closeConfirmModal} onConfirm={this.publish} innerText={`You are about to post the ${this.props.type.toString().toLowerCase()} match schedule. This can only be done once. Are you sure you wish to perform this action?`}/>
        <Card fluid={true} color={getTheme().secondary}>
          <Card.Content>
            {
              this.props.matchList.length > 0 &&
              <span><i>The following match schedule was generated by given the parameters in the 'Match Maker Parameters' tab. Make sure the schedule generate <b>properly</b>, and then scroll to the bottom to publish the schedule. <b>This schedule can only be published once.</b></i></span>
            }
            {
              this.props.matchList.length === 0 &&
              <span><i>There is currently no generated {this.props.type.toString().toLowerCase()} match schedule. Generate one from the 'Match Maker Parameters' tab.</i></span>
            }
          </Card.Content>
          <Card.Content>
            <Table color={getTheme().secondary} attached={true} celled={true} textAlign="center" columns={16}>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell width={2}>Match</Table.HeaderCell>
                  <Table.HeaderCell width={1}>Field</Table.HeaderCell>
                  <Table.HeaderCell width={1}>Time</Table.HeaderCell>
                  {redLabels}
                  {blueLabels}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {matchesView}
              </Table.Body>
            </Table>
            <Divider/>
            {
              this.props.matchList.length > 0 &&
              <Button color={getTheme().primary} loading={this.props.navigationDisabled} disabled={this.props.navigationDisabled} onClick={this.openConfirmModal}>Save &amp; Publish</Button>
            }
          </Card.Content>
        </Card>
      </div>
    );
  }

  private openConfirmModal() {
    this.setState({confirmModalOpen: true});
  }

  private closeConfirmModal() {
    this.setState({confirmModalOpen: false});
  }

  private publish() {
    this.closeConfirmModal();
    this.props.onComplete();
  }
}

export function mapStateToProps({configState, internalState}: IApplicationState) {
  return {
    eventConfig: configState.eventConfiguration,
    navigationDisabled: internalState.navigationDisabled
  };
}

export default connect(mapStateToProps)(SetupMatchScheduleOverview);