import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, IssueFilter, PageActions } from './styles';

const propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      repository: PropTypes.string
    })
  }).isRequired
};

class Repository extends Component {
  constructor(props) {
    super(props);
    this.state = {
      repository: {},
      issues: [],
      loading: true,
      filters: [
        { state: 'all', label: 'All' },
        { state: 'open', label: 'Open' },
        { state: 'closed', label: 'Closed' }
      ],
      filterIndex: 0,
      page: 1
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { filters, filterIndex } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`repos/${repoName}`),
      api.get(`repos/${repoName}/issues`, {
        params: {
          state: filters[filterIndex].state,
          per_page: 5
        }
      })
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false
    });
  }

  handlePage = async action => {
    const { page } = this.state;
    await this.setState({ page: action === 'previous' ? page - 1 : page + 1 });
    this.loadIssues();
  };

  handleFilterClick = async filterIndex => {
    await this.setState({ filterIndex });
    this.loadIssues();
  };

  loadIssues = async () => {
    const { match } = this.props;
    const { filters, filterIndex, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters[filterIndex].state,
        per_page: 5,
        page
      }
    });

    this.setState({ issues: response.data });
  };

  render() {
    const {
      repository,
      issues,
      loading,
      filters,
      filterIndex,
      page
    } = this.state;

    if (loading) {
      return <Loading>Carregando...</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt="repository.owner.login" />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <IssueFilter>
            {filters.map((filter, index) => (
              <button
                type="button"
                disabled={filterIndex === index}
                key={filter.label}
                onClick={() => this.handleFilterClick(index)}
              >
                {filter.label}
              </button>
            ))}
          </IssueFilter>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt="issue.user.login" />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <PageActions>
          <button
            type="button"
            disabled={page < 2}
            onClick={() => this.handlePage('previous')}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button type="button" onClick={() => this.handlePage('next')}>
            Next
          </button>
        </PageActions>
      </Container>
    );
  }
}

Repository.propTypes = propTypes;

export default Repository;
