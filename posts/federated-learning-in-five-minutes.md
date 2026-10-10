Machine learning usually starts by collecting all the data in one place. But much of the most useful data — on phones, in hospitals, on IoT devices — cannot or should not leave where it was created. **Federated learning (FL)** flips the usual recipe: instead of bringing the data to the model, we bring the model to the data.

## The idea

A central **server** coordinates many **clients** (phones, hospitals, sensors). Each client keeps its data private and only shares *model updates*. Training proceeds in rounds:

1. The server sends the current global model $w_t$ to a subset of clients.
2. Each selected client trains the model on its own data for a few local epochs.
3. Clients send their updated models back.
4. The server combines them into a new global model $w_{t+1}$.

## FedAvg: the classic algorithm

The most widely used aggregation rule is **Federated Averaging (FedAvg)** (McMahan et al., 2017). If client $k$ holds $n_k$ samples and $n = \sum_k n_k$, the server takes a weighted average of the client models:

$$
w_{t+1} = \sum_{k=1}^{K} \frac{n_k}{n}\, w_{t+1}^{k}
$$

Clients with more data get more say. In code, the aggregation step is only a few lines:

```python
import torch

def fedavg(client_states, client_sizes):
    """Weighted average of client model state_dicts."""
    total = sum(client_sizes)
    avg = {}
    for key in client_states[0]:
        avg[key] = sum(
            state[key].float() * (n / total)
            for state, n in zip(client_states, client_sizes)
        )
    return avg
```

## Why it is hard

FedAvg is simple, but real federations raise four big challenges:

- **Statistical heterogeneity (non-IID data).** Each client's data looks different, so local models drift apart and the average can be a poor fit for everyone. This motivates *personalized* FL.
- **Systems heterogeneity.** Devices differ in compute, battery and connectivity. Slow clients (*stragglers*) delay every round.
- **Communication cost.** Sending full models back and forth is expensive, especially for large models.
- **Privacy and security.** Model updates can still leak information about the training data, and malicious clients can poison the model. Techniques such as differential privacy and secure aggregation help.

## And when the data keeps changing?

In many deployments — for example intrusion detection in IoT networks — the data distribution shifts over time. Retraining on new data can make the model forget what it learned before (*catastrophic forgetting*). Combining federated learning with **continual learning** is one of the topics I will cover in upcoming posts.

## Further reading

- H. B. McMahan et al., *Communication-Efficient Learning of Deep Networks from Decentralized Data*, AISTATS 2017.
- P. Kairouz et al., *Advances and Open Problems in Federated Learning*, Foundations and Trends in Machine Learning, 2021.
- My own work on personalization, straggler resilience and continual FL is on the [Publications](publications.html) page.
