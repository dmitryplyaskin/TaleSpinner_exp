"""Add LLM configuration tables

Revision ID: 3a7c8d9e0f12
Revises: 20251205_rename_user_id_to_uuid
Create Date: 2024-12-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '3a7c8d9e0f12'
down_revision: Union[str, None] = '20251205_change_user_id_uuid'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create tokens table
    op.create_table(
        'tokens',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('encrypted_token', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tokens_id'), 'tokens', ['id'], unique=False)
    op.create_index(op.f('ix_tokens_user_id'), 'tokens', ['user_id'], unique=False)

    # Create model_configs table
    op.create_table(
        'model_configs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('model_id', sa.String(length=256), nullable=False),
        sa.Column('token_ids', sa.JSON(), nullable=True),
        sa.Column('token_selection_strategy', sa.String(), nullable=False, default='failover'),
        sa.Column('temperature', sa.Float(), nullable=False, default=0.7),
        sa.Column('top_p', sa.Float(), nullable=False, default=1.0),
        sa.Column('top_k', sa.Integer(), nullable=True),
        sa.Column('max_tokens', sa.Integer(), nullable=False, default=4096),
        sa.Column('frequency_penalty', sa.Float(), nullable=False, default=0.0),
        sa.Column('presence_penalty', sa.Float(), nullable=False, default=0.0),
        sa.Column('stop_sequences', sa.JSON(), nullable=True),
        sa.Column('provider_settings', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_model_configs_id'), 'model_configs', ['id'], unique=False)
    op.create_index(op.f('ix_model_configs_user_id'), 'model_configs', ['user_id'], unique=False)

    # Create embedding_configs table
    op.create_table(
        'embedding_configs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('model_id', sa.String(length=256), nullable=False),
        sa.Column('token_ids', sa.JSON(), nullable=True),
        sa.Column('dimensions', sa.Integer(), nullable=True),
        sa.Column('batch_size', sa.Integer(), nullable=False, default=100),
        sa.Column('provider_settings', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_embedding_configs_id'), 'embedding_configs', ['id'], unique=False)
    op.create_index(op.f('ix_embedding_configs_user_id'), 'embedding_configs', ['user_id'], unique=False)

    # Create config_presets table
    op.create_table(
        'config_presets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('description', sa.String(length=512), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, default=False),
        sa.Column('main_model_config_id', sa.String(), nullable=False),
        sa.Column('rag_model_config_id', sa.String(), nullable=True),
        sa.Column('rag_enabled', sa.Boolean(), nullable=False, default=False),
        sa.Column('guard_model_config_id', sa.String(), nullable=True),
        sa.Column('guard_enabled', sa.Boolean(), nullable=False, default=False),
        sa.Column('storytelling_model_config_id', sa.String(), nullable=True),
        sa.Column('storytelling_enabled', sa.Boolean(), nullable=False, default=False),
        sa.Column('embedding_config_id', sa.String(), nullable=False),
        sa.Column('fallback_strategy', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['main_model_config_id'], ['model_configs.id'], ),
        sa.ForeignKeyConstraint(['rag_model_config_id'], ['model_configs.id'], ),
        sa.ForeignKeyConstraint(['guard_model_config_id'], ['model_configs.id'], ),
        sa.ForeignKeyConstraint(['storytelling_model_config_id'], ['model_configs.id'], ),
        sa.ForeignKeyConstraint(['embedding_config_id'], ['embedding_configs.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_config_presets_id'), 'config_presets', ['id'], unique=False)
    op.create_index(op.f('ix_config_presets_user_id'), 'config_presets', ['user_id'], unique=False)

    # Create stories table
    op.create_table(
        'stories',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=256), nullable=False),
        sa.Column('description', sa.String(length=1024), nullable=True),
        sa.Column('preset_id', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['preset_id'], ['config_presets.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_stories_id'), 'stories', ['id'], unique=False)
    op.create_index(op.f('ix_stories_user_id'), 'stories', ['user_id'], unique=False)

    # Create story_configs table
    op.create_table(
        'story_configs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('story_id', sa.String(), nullable=False),
        sa.Column('main_model_override', sa.JSON(), nullable=True),
        sa.Column('rag_model_override', sa.JSON(), nullable=True),
        sa.Column('guard_model_override', sa.JSON(), nullable=True),
        sa.Column('storytelling_model_override', sa.JSON(), nullable=True),
        sa.Column('embedding_override', sa.JSON(), nullable=True),
        sa.Column('rag_enabled_override', sa.Boolean(), nullable=True),
        sa.Column('guard_enabled_override', sa.Boolean(), nullable=True),
        sa.Column('storytelling_enabled_override', sa.Boolean(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['story_id'], ['stories.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('story_id'),
    )
    op.create_index(op.f('ix_story_configs_id'), 'story_configs', ['id'], unique=False)
    op.create_index(op.f('ix_story_configs_story_id'), 'story_configs', ['story_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_story_configs_story_id'), table_name='story_configs')
    op.drop_index(op.f('ix_story_configs_id'), table_name='story_configs')
    op.drop_table('story_configs')

    op.drop_index(op.f('ix_stories_user_id'), table_name='stories')
    op.drop_index(op.f('ix_stories_id'), table_name='stories')
    op.drop_table('stories')

    op.drop_index(op.f('ix_config_presets_user_id'), table_name='config_presets')
    op.drop_index(op.f('ix_config_presets_id'), table_name='config_presets')
    op.drop_table('config_presets')

    op.drop_index(op.f('ix_embedding_configs_user_id'), table_name='embedding_configs')
    op.drop_index(op.f('ix_embedding_configs_id'), table_name='embedding_configs')
    op.drop_table('embedding_configs')

    op.drop_index(op.f('ix_model_configs_user_id'), table_name='model_configs')
    op.drop_index(op.f('ix_model_configs_id'), table_name='model_configs')
    op.drop_table('model_configs')

    op.drop_index(op.f('ix_tokens_user_id'), table_name='tokens')
    op.drop_index(op.f('ix_tokens_id'), table_name='tokens')
    op.drop_table('tokens')

