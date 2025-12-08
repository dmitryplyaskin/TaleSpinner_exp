"""refactor_presets_json

Revision ID: refactor_presets_json_001
Revises: e8f64916f77c
Create Date: 2025-12-06 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'refactor_presets_json_001'
down_revision: Union[str, Sequence[str], None] = 'e8f64916f77c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: refactor config_presets to use JSON config_data."""
    # Drop foreign key constraints from config_presets
    with op.batch_alter_table('config_presets', schema=None) as batch_op:
        # Drop foreign key constraints
        batch_op.drop_constraint('config_presets_main_model_config_id_fkey', type_='foreignkey')
        batch_op.drop_constraint('config_presets_rag_model_config_id_fkey', type_='foreignkey')
        batch_op.drop_constraint('config_presets_guard_model_config_id_fkey', type_='foreignkey')
        batch_op.drop_constraint('config_presets_storytelling_model_config_id_fkey', type_='foreignkey')
        batch_op.drop_constraint('config_presets_embedding_config_id_fkey', type_='foreignkey')
        
        # Drop old columns
        batch_op.drop_column('main_model_config_id')
        batch_op.drop_column('rag_model_config_id')
        batch_op.drop_column('rag_enabled')
        batch_op.drop_column('guard_model_config_id')
        batch_op.drop_column('guard_enabled')
        batch_op.drop_column('storytelling_model_config_id')
        batch_op.drop_column('storytelling_enabled')
        batch_op.drop_column('embedding_config_id')
        
        # Add new config_data column
        batch_op.add_column(sa.Column('config_data', sa.JSON(), nullable=False, server_default='{}'))

    # Drop indexes for model_configs and embedding_configs
    op.drop_index(op.f('ix_model_configs_user_id'), table_name='model_configs', if_exists=True)
    op.drop_index(op.f('ix_model_configs_id'), table_name='model_configs', if_exists=True)
    
    op.drop_index(op.f('ix_embedding_configs_user_id'), table_name='embedding_configs', if_exists=True)
    op.drop_index(op.f('ix_embedding_configs_id'), table_name='embedding_configs', if_exists=True)
    
    # Drop tables
    op.drop_table('model_configs')
    op.drop_table('embedding_configs')


def downgrade() -> None:
    """Downgrade schema: restore old structure."""
    # Recreate tables
    op.create_table(
        'model_configs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('provider', sa.Enum('OPENROUTER', 'OLLAMA', 'OPENAI_COMPATIBLE', name='providertype'), nullable=False),
        sa.Column('model_id', sa.String(length=256), nullable=False),
        sa.Column('token_ids', sa.JSON(), nullable=True),
        sa.Column('token_selection_strategy', sa.String(), nullable=False),
        sa.Column('temperature', sa.Float(), nullable=False),
        sa.Column('top_p', sa.Float(), nullable=False),
        sa.Column('top_k', sa.Integer(), nullable=True),
        sa.Column('max_tokens', sa.Integer(), nullable=False),
        sa.Column('frequency_penalty', sa.Float(), nullable=False),
        sa.Column('presence_penalty', sa.Float(), nullable=False),
        sa.Column('stop_sequences', sa.JSON(), nullable=True),
        sa.Column('provider_settings', sa.JSON(), nullable=True),
        sa.Column('base_url', sa.String(), nullable=True),
        sa.Column('http_headers', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_model_configs_id'), 'model_configs', ['id'], unique=False)
    op.create_index(op.f('ix_model_configs_user_id'), 'model_configs', ['user_id'], unique=False)
    
    op.create_table(
        'embedding_configs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('provider', sa.Enum('OPENROUTER', 'OLLAMA', 'OPENAI_COMPATIBLE', name='providertype'), nullable=False),
        sa.Column('model_id', sa.String(length=256), nullable=False),
        sa.Column('token_ids', sa.JSON(), nullable=True),
        sa.Column('dimensions', sa.Integer(), nullable=True),
        sa.Column('batch_size', sa.Integer(), nullable=False),
        sa.Column('provider_settings', sa.JSON(), nullable=True),
        sa.Column('base_url', sa.String(), nullable=True),
        sa.Column('http_headers', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_embedding_configs_id'), 'embedding_configs', ['id'], unique=False)
    op.create_index(op.f('ix_embedding_configs_user_id'), 'embedding_configs', ['user_id'], unique=False)
    
    # Restore config_presets columns
    with op.batch_alter_table('config_presets', schema=None) as batch_op:
        batch_op.drop_column('config_data')
        batch_op.add_column(sa.Column('main_model_config_id', sa.String(), nullable=False))
        batch_op.add_column(sa.Column('rag_model_config_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('rag_enabled', sa.Boolean(), nullable=False, server_default='false'))
        batch_op.add_column(sa.Column('guard_model_config_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('guard_enabled', sa.Boolean(), nullable=False, server_default='false'))
        batch_op.add_column(sa.Column('storytelling_model_config_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('storytelling_enabled', sa.Boolean(), nullable=False, server_default='false'))
        batch_op.add_column(sa.Column('embedding_config_id', sa.String(), nullable=False))
        
        # Restore foreign key constraints
        batch_op.create_foreign_key('config_presets_main_model_config_id_fkey', 'model_configs', ['main_model_config_id'], ['id'])
        batch_op.create_foreign_key('config_presets_rag_model_config_id_fkey', 'model_configs', ['rag_model_config_id'], ['id'])
        batch_op.create_foreign_key('config_presets_guard_model_config_id_fkey', 'model_configs', ['guard_model_config_id'], ['id'])
        batch_op.create_foreign_key('config_presets_storytelling_model_config_id_fkey', 'model_configs', ['storytelling_model_config_id'], ['id'])
        batch_op.create_foreign_key('config_presets_embedding_config_id_fkey', 'embedding_configs', ['embedding_config_id'], ['id'])
