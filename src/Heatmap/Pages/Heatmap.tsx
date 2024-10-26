import './Heatmap.css'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Plot from 'react-plotly.js'

const indexerUrl = 'https://mainnet-idx.algonode.cloud'

interface TokenBalance {
  address: string
  amount: string
}

const Heatmap: React.FC = () => {
  const [topWallets, setTopWallets] = useState<TokenBalance[]>([])
  const [assetId, setAssetId] = useState<number>(1691271561) // Default Asset ID
  const [inputAssetId, setInputAssetId] = useState<string>('1691271561') // Input box state

  const fetchTokenBalances = async (assetId: number): Promise<TokenBalance[]> => {
    let balances: TokenBalance[] = []
    let nextToken = ''

    while (true) {
      try {
        const url = `${indexerUrl}/v2/assets/${assetId}/balances`
        const params = nextToken ? { next: nextToken } : {}
        const response = await axios.get(url, { params })
        const data = response.data

        balances = [...balances, ...data.balances]
        nextToken = data['next-token']
        if (!nextToken) break
      } catch (error) {
        console.error('An error occurred:', error)
        break
      }
    }

    return balances
  }

  useEffect(() => {
    const getBalances = async () => {
      const balances = await fetchTokenBalances(assetId)
      setTopWallets(balances)
    }

    getBalances()
  }, [assetId]) // Re-fetch data whenever assetId changes

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAssetId = parseInt(inputAssetId, 10)
    if (!isNaN(parsedAssetId)) {
      setAssetId(parsedAssetId)
    }
  }

  const showHeatmap = () => {
    const N = 50
    const sortedWallets = topWallets
      .map((wallet) => ({ ...wallet, amount: parseFloat(wallet.amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, N)

    const normalizedAmounts = sortedWallets.map((wallet) => Math.log10(wallet.amount + 1))
    const rows = 5
    const cols = 10

    const heatmapData = Array.from({ length: rows }, (_, rowIndex) =>
      normalizedAmounts.slice(rowIndex * cols, (rowIndex + 1) * cols)
    )
    return (
      <div className="chart-container">
        <Plot
          data={[
            {
              z: heatmapData,
              type: 'heatmap',
              colorscale: 'YlOrRd',
              colorbar: {
                title: 'Token Amount',
              },
            },
          ]}
          layout={{
            title: `Token Distribution Heatmap for ASA ${assetId} (Mainnet)`,
            xaxis: { title: 'Wallet Column Index' },
            yaxis: { title: 'Wallet Row Index' },
            margin: { l: 40, r: 40, t: 80, b: 100 },
            width: 1100,
            height: 680,
          }}
        />
      </div>
    )
  }

  const showBubbleChart = () => {
    const N = 50
    const sortedWallets = topWallets
      .map((wallet) => ({ ...wallet, amount: parseFloat(wallet.amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, N)

    const maxAmount = Math.max(...sortedWallets.map((wallet) => wallet.amount))
    const bubbleData = sortedWallets.map((wallet, index) => ({
      walletIndex: (index + 1).toString(),
      amount: wallet.amount / maxAmount * 100,
    }))

    return (
      <div className="chart-container">
        <Plot
          data={[
            {
              x: bubbleData.map((_, index) => index + 1),
              y: bubbleData.map((data) => data.amount),
              text: bubbleData.map(
                (wallet) => `Wallet Index: ${wallet.walletIndex}<br>Token Amount: ${wallet.amount.toFixed(2)}`
              ),
              mode: 'markers',
              marker: {
                size: bubbleData.map((data) => data.amount / 2),
                color: bubbleData.map((data) => data.amount),
                colorscale: 'Viridis',
                showscale: true,
              },
            },
          ]}
          layout={{
            title: `Whale Asset vs Small Wallets for ASA ${assetId}`,
            xaxis: { title: 'Wallet Index (Sorted by Amount)' },
            yaxis: { title: 'Token Amount (Normalized)' },
            margin: { l: 40, r: 40, t: 80, b: 100 },
            coloraxis: {
              colorbar: {
                title: 'Token Amount',
              },
            },
            width: 1100,
            height: 680,
          }}
        />
      </div>
    )
  }

  return (
    <div className="scrollable-container">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          value={inputAssetId}
          onChange={(e) => setInputAssetId(e.target.value)}
          placeholder="Enter Asset ID"
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>
      {showHeatmap()}
      {showBubbleChart()}
    </div>
  )
}

export default Heatmap
