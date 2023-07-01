import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiContext } from '../contexts/ApiContext.jsx';
import { ResultsContext } from '../contexts/ResultsContext.jsx';
import { FunctionResponseContext } from '../contexts/FunctionResponseContext.jsx';

import { Header } from '../components/Header.jsx';
import { ApiSelection } from '../components/ApiSelection.jsx';
import { Spinner } from '../components/Spinner.jsx';

export function DataFetching() {
	const { apiState } = useContext(ApiContext);
	const { resultsState, resultsDispatch } = useContext(ResultsContext);
	const { inputRecordsJson } = resultsState;
	const { responseState, responseDispatch, responseTimeout } = useContext(FunctionResponseContext);
	const { isRunning, isError, errorMsg } = responseState;

	const [apiEndpoint, setApiEndpoint] = useState('');
	const [apiSingleId, setApiSingleId] = useState(null);
	const [apiParams, setApiParams] = useState('');
	const [resetApi, setResetApi] = useState(null);
	const navigate = useNavigate();

	// Return selected API component
	const ApiComponent = apiState.component;

	async function fetchData() {
		if (responseTimeout.current) {
			clearTimeout(responseTimeout.current);
		}
		responseDispatch({ type: 'START_FUNCTION' });

		await apiState
			.fetchFunc(apiEndpoint, apiSingleId, apiParams)
			.then(({ totalHits, totalRecords }) => {
				resultsDispatch({
					type: 'UPDATE',
					resultType: 'inputRecordsJson',
					data: totalRecords,
					count: totalHits,
				});
				responseDispatch({ type: 'HANDLE_RESPONSE', successMsg: '' });
				responseTimeout.current = setTimeout(
					() => responseDispatch({ type: 'RESET_RESPONSE' }),
					5000
				);
			})
			.catch((error) => {
				console.error(error);
				responseDispatch({ type: 'HANDLE_ERROR', errorMsg: error.message });
				responseTimeout.current = setTimeout(
					() => responseDispatch({ type: 'RESET_RESPONSE' }),
					5000
				);
			});
	}

	function resetOptions() {
		const reset = confirm('Are you sure to reset all options?');
		if (reset === true) {
			resetApi();
		}
	}

	function resetRecords() {
		const reset = confirm('Are you sure to reset all records?');
		if (reset === true) {
			resultsDispatch({ type: 'RESET', resultType: 'inputRecordsJson' });
		}
	}

	useEffect(() => {
		responseDispatch({ type: 'RESET_RESPONSE' });

		return () => {
			clearTimeout(responseTimeout.current);
		};
	}, []);

	return (
		<>
			<Header>
				<ApiSelection />
			</Header>

			<main>
				{/* API name, URL & search parameters */}
				<h2>{apiState.name} API</h2>
				<p>
					<b>
						{apiState.url}
						{apiEndpoint}
						{apiSingleId ? `/${apiSingleId}` : ''}
						/?{new URLSearchParams(apiParams).toString()}
					</b>
				</p>

				<div className='msg-box'>
					{isRunning && !isError && (
						<>
							<span>Fetching...</span>
							<Spinner />
						</>
					)}
					{!isRunning && !isError && (
						<span>
							Returned <b>{inputRecordsJson.data.length}</b> of{' '}
							<b>{inputRecordsJson.count}</b> results
						</span>
					)}
					{!isRunning && isError && (
						<span className='error-msg'>{errorMsg}</span>
					)}
				</div>

				<div className='btns'>
					<button
						className={isRunning ? 'disabled' : ''}
						onClick={fetchData}
						disabled={isRunning}
					>
						Fetch Data
					</button>
					<button
						className={isRunning ? 'disabled' : ''}
						onClick={resetOptions}
						disabled={isRunning}
					>
						Reset Options
					</button>
					<button
						className={isRunning ? 'disabled' : ''}
						onClick={resetRecords}
						disabled={isRunning}
					>
						Reset Results
					</button>
					<button
						className={isRunning ? 'disabled' : ''}
						onClick={() => navigate('data-processing')}
						disabled={isRunning}
					>
						Process Data
					</button>
				</div>

				{/* Display selected API options */}
				<ApiComponent
					setApiEndpoint={setApiEndpoint}
					setApiSingleId={setApiSingleId}
					setApiParams={setApiParams}
					setResetApi={setResetApi}
				/>
			</main>
		</>
	);
}
